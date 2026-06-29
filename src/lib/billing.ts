// Motor de cobrança (billing engine).
// - Gera faturas (invoices) a partir das assinaturas ativas
// - Avança o próximo vencimento conforme o ciclo
// - Marca faturas vencidas como OVERDUE
//
// Pensado para ser chamado por um cron job diário (ver /api/cron/billing).

import { addMonths, addYears, setDate } from "date-fns";
import { prisma } from "./prisma";
import { createCharge } from "./asaas";
import { sendEmail, renderInvoiceEmail } from "./email";
import { sendWhatsApp, renderInvoiceWhatsApp } from "./whatsapp";
import { toNumber } from "./utils";
import type { BillingCycle } from "@prisma/client";

export function advanceDueDate(from: Date, cycle: BillingCycle): Date {
  return cycle === "YEARLY" ? addYears(from, 1) : addMonths(from, 1);
}

// Ajusta a data para o "dia de vencimento" desejado (1-28).
export function withDueDay(date: Date, dueDay: number): Date {
  const safeDay = Math.min(Math.max(dueDay, 1), 28);
  return setDate(date, safeDay);
}

/**
 * Gera as cobranças das assinaturas cujo próximo vencimento já chegou
 * (dentro de `horizonDays` à frente). Idempotente: não duplica fatura
 * de uma assinatura que já tem cobrança em aberto para o mesmo vencimento.
 */
export async function generateDueInvoices(horizonDays = 0) {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + horizonDays);

  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE", nextDueDate: { lte: horizon } },
    include: { client: true, product: true },
  });

  const created: string[] = [];

  for (const sub of subs) {
    const dueDate = sub.nextDueDate;

    // Já existe fatura desta assinatura para este vencimento?
    const exists = await prisma.invoice.findFirst({
      where: {
        subscriptionId: sub.id,
        dueDate,
        status: { in: ["PENDING", "PAID", "OVERDUE"] },
      },
    });
    if (exists) {
      // Garante que o nextDueDate avance mesmo se já havia fatura.
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextDueDate: advanceDueDate(dueDate, sub.cycle) },
      });
      continue;
    }

    const invoice = await prisma.invoice.create({
      data: {
        clientId: sub.clientId,
        subscriptionId: sub.id,
        productId: sub.productId,
        description: `Mensalidade ${sub.product.name}`,
        type: "SUBSCRIPTION",
        amount: sub.amount,
        dueDate,
        status: "PENDING",
      },
    });

    // Gera link de pagamento no gateway (mock por enquanto).
    let paymentLink: string | null = null;
    try {
      const charge = await createCharge({
        customerName: sub.client.name,
        customerEmail: sub.client.email,
        customerDocument: sub.client.document,
        description: `Mensalidade ${sub.product.name} — ${sub.client.name}`,
        amount: toNumber(sub.amount),
        dueDate,
        externalReference: invoice.id,
      });
      paymentLink = charge.paymentLink;
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { externalId: charge.externalId, paymentLink: charge.paymentLink },
      });
    } catch (err) {
      console.error("Falha ao gerar cobrança no gateway:", err);
    }

    // Envia e-mail de cobrança (se o cliente tiver e-mail e o Resend estiver ligado).
    if (sub.client.email) {
      try {
        const { subject, html } = await renderInvoiceEmail({
          clientName: sub.client.name,
          description: `Mensalidade ${sub.product.name}`,
          amount: sub.amount,
          dueDate,
          paymentLink,
        });
        await sendEmail({ to: sub.client.email, subject, html });
      } catch (err) {
        console.error("Falha ao enviar e-mail de cobrança:", err);
      }
    }

    // Envia WhatsApp de cobrança (se o cliente tiver telefone e a Evolution estiver ligada).
    if (sub.client.phone) {
      try {
        const message = await renderInvoiceWhatsApp({
          clientName: sub.client.name,
          description: `Mensalidade ${sub.product.name}`,
          amount: sub.amount,
          dueDate,
          paymentLink,
        });
        await sendWhatsApp({ phone: sub.client.phone, message });
      } catch (err) {
        console.error("Falha ao enviar WhatsApp de cobrança:", err);
      }
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { nextDueDate: advanceDueDate(dueDate, sub.cycle) },
    });

    created.push(invoice.id);
  }

  return created;
}

/** Marca como OVERDUE as faturas PENDING que já passaram do vencimento. */
export async function markOverdueInvoices() {
  const now = new Date();
  const res = await prisma.invoice.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  // Marca clientes com fatura atrasada como inadimplentes.
  const overdue = await prisma.invoice.findMany({
    where: { status: "OVERDUE" },
    select: { clientId: true },
    distinct: ["clientId"],
  });
  if (overdue.length > 0) {
    await prisma.client.updateMany({
      where: { id: { in: overdue.map((o) => o.clientId) }, status: "ACTIVE" },
      data: { status: "DELINQUENT" },
    });
  }

  return res.count;
}

/** Registra pagamento de uma fatura e atualiza status. */
export async function registerPayment(
  invoiceId: string,
  method: "PIX" | "BOLETO" | "CARD" | "MANUAL" = "MANUAL",
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Fatura não encontrada");

  await prisma.payment.create({
    data: { invoiceId, amount: invoice.amount, method, paidAt: new Date() },
  });
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Se o cliente não tem mais faturas em aberto, volta para ATIVO.
  const stillOpen = await prisma.invoice.count({
    where: { clientId: invoice.clientId, status: { in: ["PENDING", "OVERDUE"] } },
  });
  if (stillOpen === 0) {
    await prisma.client.update({
      where: { id: invoice.clientId },
      data: { status: "ACTIVE" },
    });
  }
}
