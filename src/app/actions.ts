"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCharge } from "@/lib/asaas";
import { sendEmail, renderInvoiceEmail } from "@/lib/email";
import { sendWhatsApp, renderInvoiceWhatsApp } from "@/lib/whatsapp";
import { setSettings, SETTING_KEYS } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import {
  generateDueInvoices,
  markOverdueInvoices,
  registerPayment,
} from "@/lib/billing";
import type { BillingCycle, CostCategory, ProductType, InvoiceType } from "@prisma/client";

export async function createClient(formData: FormData) {
  await prisma.client.create({
    data: {
      name: String(formData.get("name") || "").trim(),
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      document: (formData.get("document") as string) || null,
    },
  });
  revalidatePath("/clientes");
}

export async function createProduct(formData: FormData) {
  const impl = formData.get("implementationPrice");
  await prisma.product.create({
    data: {
      name: String(formData.get("name") || "").trim(),
      description: (formData.get("description") as string) || null,
      defaultPrice: toNumber(formData.get("defaultPrice")),
      implementationPrice: impl ? toNumber(impl) : null,
      type: (formData.get("type") as ProductType) || "RECURRING",
    },
  });
  revalidatePath("/produtos");
}

export async function toggleProductActive(formData: FormData) {
  const id = String(formData.get("productId"));
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;
  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });
  revalidatePath("/produtos");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("productId"));
  // Só exclui de fato se não houver assinaturas vinculadas; caso contrário,
  // inativa (preserva o histórico de cobranças).
  const subs = await prisma.subscription.count({ where: { productId: id } });
  if (subs > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.invoice.updateMany({ where: { productId: id }, data: { productId: null } });
    await prisma.cost.updateMany({ where: { productId: id }, data: { productId: null } });
    await prisma.product.delete({ where: { id } });
  }
  revalidatePath("/produtos");
}

export async function createCost(formData: FormData) {
  const dateRaw = String(formData.get("date") || "");
  await prisma.cost.create({
    data: {
      description: String(formData.get("description") || "").trim(),
      amount: toNumber(formData.get("amount")),
      category: (formData.get("category") as CostCategory) || "OTHER",
      recurring: formData.get("recurring") === "on",
      clientId: (formData.get("clientId") as string) || null,
      // Data escolhida (meio-dia p/ evitar deslize de fuso); vazio = hoje (default).
      ...(dateRaw ? { date: new Date(`${dateRaw}T12:00:00`) } : {}),
    },
  });
  revalidatePath("/despesas");
}

export async function createSubscription(formData: FormData) {
  const productId = String(formData.get("productId"));
  const product = await prisma.product.findUnique({ where: { id: productId } });
  const amountRaw = formData.get("amount");
  const amount = amountRaw ? toNumber(amountRaw) : toNumber(product?.defaultPrice);
  const cycle = (formData.get("cycle") as BillingCycle) || "MONTHLY";

  // Data da 1ª cobrança escolhida pelo usuário (no fuso local); fallback: hoje.
  const startRaw = String(formData.get("startDate") || "");
  const next = startRaw ? new Date(`${startRaw}T00:00:00`) : new Date();
  // Dia do vencimento recorrente = dia da 1ª cobrança (limitado a 1–28).
  const dueDay = Math.min(Math.max(next.getDate(), 1), 28);

  await prisma.subscription.create({
    data: {
      clientId: String(formData.get("clientId")),
      productId,
      amount,
      cycle,
      dueDay,
      nextDueDate: next,
    },
  });
  revalidatePath("/assinaturas");
}

// Cria uma cobrança avulsa já com link de pagamento.
// Tipo "COMBO" = Implantação + Mensalidade: cria DUAS faturas (cada uma com
// seu tipo, p/ a receita ficar correta) mas UM único pagamento do total.
export async function createInvoice(formData: FormData) {
  const clientId = String(formData.get("clientId"));
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return;

  // Vencimento não pode ser no passado (o Asaas recusa) — ajusta p/ hoje.
  const dueStr = String(formData.get("dueDate") || "");
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
  const effectiveDueStr = !dueStr || dueStr < todayStr ? todayStr : dueStr;
  const dueDate = new Date(`${effectiveDueStr}T12:00:00`);
  const description = String(formData.get("description") || "Cobrança");
  const type = String(formData.get("type") || "EXTRA");
  const productId = (formData.get("productId") as string) || null;

  const invoiceIds: string[] = [];
  let total = 0;

  if (type === "COMBO") {
    const impl = toNumber(formData.get("implAmount"));
    const sub = toNumber(formData.get("subAmount"));
    total = impl + sub;
    if (impl > 0) {
      const i = await prisma.invoice.create({
        data: { clientId, productId, description: `Implantação — ${description}`, type: "IMPLEMENTATION", amount: impl, dueDate, status: "PENDING" },
      });
      invoiceIds.push(i.id);
    }
    if (sub > 0) {
      const i = await prisma.invoice.create({
        data: { clientId, productId, description: `Mensalidade — ${description}`, type: "SUBSCRIPTION", amount: sub, dueDate, status: "PENDING" },
      });
      invoiceIds.push(i.id);
    }
  } else {
    const amount = toNumber(formData.get("amount"));
    total = amount;
    const i = await prisma.invoice.create({
      data: { clientId, productId, description, type: (type as InvoiceType) || "EXTRA", amount, dueDate, status: "PENDING" },
    });
    invoiceIds.push(i.id);
  }

  if (invoiceIds.length === 0) return;

  // Um único pagamento no gateway para o total, vinculado a todas as faturas.
  try {
    const charge = await createCharge({
      customerName: client.name,
      customerEmail: client.email,
      customerDocument: client.document,
      description: type === "COMBO" ? `Implantação + Mensalidade — ${description}` : description,
      amount: total,
      dueDate,
      externalReference: invoiceIds[0],
    });
    await prisma.invoice.updateMany({
      where: { id: { in: invoiceIds } },
      data: { externalId: charge.externalId, paymentLink: charge.paymentLink },
    });
  } catch (e) {
    console.error(e);
  }

  revalidatePath("/cobrancas");
  revalidatePath("/");
}

// Envia (ou reenvia) o e-mail de cobrança de uma fatura.
export async function sendInvoiceEmail(formData: FormData) {
  const id = String(formData.get("invoiceId"));
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!invoice || !invoice.client.email) return;

  const { subject, html } = await renderInvoiceEmail({
    clientName: invoice.client.name,
    description: invoice.description,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    paymentLink: invoice.paymentLink,
  });
  await sendEmail({ to: invoice.client.email, subject, html });
  revalidatePath("/cobrancas");
}

// Envia (ou reenvia) a cobrança por WhatsApp.
export async function sendInvoiceWhatsApp(formData: FormData) {
  const id = String(formData.get("invoiceId"));
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!invoice || !invoice.client.phone) return;

  const message = await renderInvoiceWhatsApp({
    clientName: invoice.client.name,
    description: invoice.description,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    paymentLink: invoice.paymentLink,
  });
  await sendWhatsApp({ phone: invoice.client.phone, message });
  revalidatePath("/cobrancas");
}

export async function markPaid(formData: FormData) {
  await registerPayment(String(formData.get("invoiceId")), "MANUAL");
  revalidatePath("/cobrancas");
  revalidatePath("/");
}

// Exclui uma cobrança (e seus pagamentos).
export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("invoiceId"));
  await prisma.payment.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/cobrancas");
  revalidatePath("/");
}

// Exclui uma despesa.
export async function deleteCost(formData: FormData) {
  const id = String(formData.get("costId"));
  await prisma.cost.delete({ where: { id } });
  revalidatePath("/despesas");
}

// Salva os templates de mensagem (WhatsApp + e-mail).
export async function saveMessageTemplates(formData: FormData) {
  await setSettings({
    [SETTING_KEYS.waTemplate]: String(formData.get("waTemplate") ?? ""),
    [SETTING_KEYS.emailSubject]: String(formData.get("emailSubject") ?? ""),
    [SETTING_KEYS.emailBody]: String(formData.get("emailBody") ?? ""),
  });
  revalidatePath("/mensagens");
  redirect("/mensagens?saved=1");
}

// Salva os dados da empresa (Configurações).
export async function saveCompanySettings(formData: FormData) {
  await setSettings({
    [SETTING_KEYS.companyName]: String(formData.get("companyName") ?? ""),
    [SETTING_KEYS.companyCnpj]: String(formData.get("companyCnpj") ?? ""),
    [SETTING_KEYS.companyEmail]: String(formData.get("companyEmail") ?? ""),
    [SETTING_KEYS.companyPhone]: String(formData.get("companyPhone") ?? ""),
    [SETTING_KEYS.companyPix]: String(formData.get("companyPix") ?? ""),
    [SETTING_KEYS.companyAddress]: String(formData.get("companyAddress") ?? ""),
  });
  revalidatePath("/configuracoes");
  revalidatePath("/relatorios");
  redirect("/configuracoes?saved=1");
}

// Executa o motor de cobrança manualmente (também roda no cron).
export async function runBilling() {
  await generateDueInvoices(3); // gera com 3 dias de antecedência
  await markOverdueInvoices();
  revalidatePath("/cobrancas");
  revalidatePath("/");
}
