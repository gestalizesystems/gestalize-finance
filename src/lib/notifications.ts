// Feed de atividade recente para o sino de notificações do dashboard:
// pagamentos recebidos, assinaturas pagas, cobranças geradas e faturas vencidas.

import { prisma } from "./prisma";
import { toNumber } from "./utils";

export type NotificationType = "payment" | "subscription" | "invoice" | "overdue";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  client: string;
  amount: number;
  at: Date;
};

export async function getNotifications(limit = 12): Promise<NotificationItem[]> {
  const [payments, invoices, overdue] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 8,
      include: { invoice: { include: { client: true } } },
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { client: true },
    }),
    prisma.invoice.findMany({
      where: { status: "OVERDUE" },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { client: true },
    }),
  ]);

  const items: NotificationItem[] = [];

  for (const p of payments) {
    if (!p.invoice) continue;
    const isSub = p.invoice.subscriptionId != null;
    items.push({
      id: `pay-${p.id}`,
      type: isSub ? "subscription" : "payment",
      title: isSub ? "Assinatura paga" : "Pagamento recebido",
      client: p.invoice.client.name,
      amount: toNumber(p.amount),
      at: p.paidAt,
    });
  }
  for (const inv of invoices) {
    items.push({
      id: `inv-${inv.id}`,
      type: "invoice",
      title: "Cobrança gerada",
      client: inv.client.name,
      amount: toNumber(inv.amount),
      at: inv.createdAt,
    });
  }
  for (const inv of overdue) {
    items.push({
      id: `ovd-${inv.id}`,
      type: "overdue",
      title: "Fatura vencida",
      client: inv.client.name,
      amount: toNumber(inv.amount),
      at: inv.dueDate,
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, limit);
}
