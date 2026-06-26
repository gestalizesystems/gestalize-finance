"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createCharge } from "@/lib/asaas";
import { toNumber } from "@/lib/utils";
import {
  generateDueInvoices,
  markOverdueInvoices,
  registerPayment,
  advanceDueDate,
  withDueDay,
} from "@/lib/billing";
import type { BillingCycle, CostCategory, ProductType } from "@prisma/client";

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
  await prisma.product.create({
    data: {
      name: String(formData.get("name") || "").trim(),
      description: (formData.get("description") as string) || null,
      defaultPrice: toNumber(formData.get("defaultPrice")),
      type: (formData.get("type") as ProductType) || "RECURRING",
    },
  });
  revalidatePath("/produtos");
}

export async function createCost(formData: FormData) {
  await prisma.cost.create({
    data: {
      description: String(formData.get("description") || "").trim(),
      amount: toNumber(formData.get("amount")),
      category: (formData.get("category") as CostCategory) || "OTHER",
      recurring: formData.get("recurring") === "on",
      clientId: (formData.get("clientId") as string) || null,
    },
  });
  revalidatePath("/despesas");
}

export async function createSubscription(formData: FormData) {
  const productId = String(formData.get("productId"));
  const product = await prisma.product.findUnique({ where: { id: productId } });
  const amountRaw = formData.get("amount");
  const amount = amountRaw ? toNumber(amountRaw) : toNumber(product?.defaultPrice);
  const dueDay = Number(formData.get("dueDay") || 5);
  const cycle = (formData.get("cycle") as BillingCycle) || "MONTHLY";

  // Próximo vencimento: próximo dia "dueDay" a partir de hoje.
  let next = withDueDay(new Date(), dueDay);
  if (next < new Date()) next = advanceDueDate(next, cycle);

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

// Cria uma cobrança avulsa (ex: taxa de implementação) já com link de pagamento.
export async function createInvoice(formData: FormData) {
  const clientId = String(formData.get("clientId"));
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return;

  const amount = toNumber(formData.get("amount"));
  const dueDate = new Date(String(formData.get("dueDate")));
  const description = String(formData.get("description") || "Cobrança");

  const invoice = await prisma.invoice.create({
    data: {
      clientId,
      productId: (formData.get("productId") as string) || null,
      description,
      type: (formData.get("type") as any) || "EXTRA",
      amount,
      dueDate,
      status: "PENDING",
    },
  });

  try {
    const charge = await createCharge({
      customerName: client.name,
      customerEmail: client.email,
      customerDocument: client.document,
      description,
      amount,
      dueDate,
      externalReference: invoice.id,
    });
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { externalId: charge.externalId, paymentLink: charge.paymentLink },
    });
  } catch (e) {
    console.error(e);
  }

  revalidatePath("/cobrancas");
  revalidatePath("/");
}

export async function markPaid(formData: FormData) {
  await registerPayment(String(formData.get("invoiceId")), "MANUAL");
  revalidatePath("/cobrancas");
  revalidatePath("/");
}

// Executa o motor de cobrança manualmente (também roda no cron).
export async function runBilling() {
  const created = await generateDueInvoices(3); // gera com 3 dias de antecedência
  const overdue = await markOverdueInvoices();
  revalidatePath("/cobrancas");
  revalidatePath("/");
  return { created: created.length, overdue };
}
