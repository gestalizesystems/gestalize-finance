import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@prisma/client";

// Webhook do Asaas: chamado quando um pagamento muda de status.
// Quando confirma (RECEIVED/CONFIRMED), marca a fatura como paga e registra
// o pagamento — fechando o ciclo de cobrança automaticamente.
//
// Configurar no painel do Asaas: URL = https://SEU_DOMINIO/api/webhooks/asaas
// e (opcional) um token de acesso, que vem no header "asaas-access-token".

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

export async function POST(req: Request) {
  // Validação opcional por token (configurado no painel do Asaas).
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

  if (!PAID_EVENTS.has(event)) {
    // Evento que não nos interessa (ex: criada, vencida) — confirma recebimento.
    return NextResponse.json({ ok: true, ignored: event });
  }

  // Localiza a fatura: por externalReference (nosso id) ou pelo id do gateway.
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

  // Reativa o cliente se não houver mais faturas em aberto.
  const stillOpen = await prisma.invoice.count({
    where: { clientId: invoice.clientId, status: { in: ["PENDING", "OVERDUE"] } },
  });
  if (stillOpen === 0) {
    await prisma.client.update({
      where: { id: invoice.clientId },
      data: { status: "ACTIVE" },
    });
  }

  return NextResponse.json({ ok: true, invoiceId: invoice.id, status: "PAID" });
}
