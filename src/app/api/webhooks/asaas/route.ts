import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@prisma/client";

// Webhook do Asaas: reage às mudanças de status de uma cobrança.
// - Pago (RECEIVED/CONFIRMED): marca a fatura como paga + registra pagamento
// - Vencida (OVERDUE): marca como atrasada + cliente inadimplente
// - Removida (DELETED): marca a fatura como cancelada
// - Estornada (REFUNDED): desfaz a baixa (cancela + remove pagamentos)
//
// Configurar no Asaas: URL = https://SEU_DOMINIO/api/webhooks/asaas
// + token opcional (header "asaas-access-token" == ASAAS_WEBHOOK_TOKEN).

type AsaasWebhookBody = {
  event?: string;
  payment?: {
    id?: string;
    externalReference?: string;
    value?: number;
    billingType?: string;
  };
};

const PAID_EVENTS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED_IN_CASH",
]);
const OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);
const CANCEL_EVENTS = new Set(["PAYMENT_DELETED"]);
const REFUND_EVENTS = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_RECEIVED_IN_CASH_UNDONE",
]);

function mapMethod(billingType?: string): PaymentMethod {
  switch (billingType) {
    case "PIX":
      return "PIX";
    case "BOLETO":
      return "BOLETO";
    case "CREDIT_CARD":
      return "CARD";
    default:
      return "MANUAL";
  }
}

// Reavalia o status do cliente: inadimplente se tem fatura atrasada, senão ativo.
async function refreshClientStatus(clientId: string) {
  const overdue = await prisma.invoice.count({
    where: { clientId, status: "OVERDUE" },
  });
  await prisma.client.update({
    where: { id: clientId },
    data: { status: overdue > 0 ? "DELINQUENT" : "ACTIVE" },
  });
}

export async function POST(req: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (expected) {
    const got = req.headers.get("asaas-access-token");
    if (got !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let body: AsaasWebhookBody;
  try {
    body = (await req.json()) as AsaasWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const event = body?.event ?? "";
  const payment = body?.payment ?? {};

  const known =
    PAID_EVENTS.has(event) ||
    OVERDUE_EVENTS.has(event) ||
    CANCEL_EVENTS.has(event) ||
    REFUND_EVENTS.has(event);
  if (!known) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  // Localiza a fatura por externalReference (nosso id) ou id do gateway.
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        payment.externalReference ? { id: String(payment.externalReference) } : undefined,
        payment.id ? { externalId: String(payment.id) } : undefined,
      ].filter(Boolean) as object[],
    },
  });
  if (!invoice) {
    return NextResponse.json({ ok: true, warning: "invoice não encontrada" });
  }

  // ---------- PAGO ----------
  if (PAID_EVENTS.has(event)) {
    if (invoice.status === "PAID") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: payment.value != null ? Number(payment.value) : invoice.amount,
        method: mapMethod(payment.billingType),
        paidAt: new Date(),
        externalId: payment.id ? String(payment.id) : null,
      },
    });
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await refreshClientStatus(invoice.clientId);
    return NextResponse.json({ ok: true, invoiceId: invoice.id, status: "PAID" });
  }

  // ---------- VENCIDA ----------
  if (OVERDUE_EVENTS.has(event)) {
    if (invoice.status === "PENDING") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "OVERDUE" },
      });
    }
    await refreshClientStatus(invoice.clientId);
    return NextResponse.json({ ok: true, invoiceId: invoice.id, status: "OVERDUE" });
  }

  // ---------- REMOVIDA ----------
  if (CANCEL_EVENTS.has(event)) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "CANCELED" },
    });
    await refreshClientStatus(invoice.clientId);
    return NextResponse.json({ ok: true, invoiceId: invoice.id, status: "CANCELED" });
  }

  // ---------- ESTORNADA (desfaz a baixa) ----------
  if (REFUND_EVENTS.has(event)) {
    await prisma.payment.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "CANCELED", paidAt: null },
    });
    await refreshClientStatus(invoice.clientId);
    return NextResponse.json({ ok: true, invoiceId: invoice.id, status: "REFUNDED" });
  }

  return NextResponse.json({ ok: true, ignored: event });
}
