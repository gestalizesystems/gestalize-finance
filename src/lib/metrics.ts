// Agregações financeiras para o dashboard.
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "./prisma";
import { toNumber, variation } from "./utils";

async function revenueInRange(start: Date, end: Date) {
  const agg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { paidAt: { gte: start, lte: end } },
  });
  return toNumber(agg._sum.amount);
}

async function expensesInRange(start: Date, end: Date) {
  const agg = await prisma.cost.aggregate({
    _sum: { amount: true },
    where: { date: { gte: start, lte: end } },
  });
  return toNumber(agg._sum.amount);
}

// Receita recorrente mensal: soma das assinaturas ativas normalizada p/ mês.
async function getMRR() {
  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    select: { amount: true, cycle: true },
  });
  return subs.reduce((acc, s) => {
    const v = toNumber(s.amount);
    return acc + (s.cycle === "YEARLY" ? v / 12 : v);
  }, 0);
}

export async function getDashboardMetrics() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const [
    revenue,
    prevRevenue,
    expenses,
    prevExpenses,
    mrr,
    statusCounts,
  ] = await Promise.all([
    revenueInRange(monthStart, monthEnd),
    revenueInRange(prevStart, prevEnd),
    expensesInRange(monthStart, monthEnd),
    expensesInRange(prevStart, prevEnd),
    getMRR(),
    prisma.invoice.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // Histórico 6 meses (receita x despesa).
  const months: { label: string; receita: number; despesa: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(now, i);
    const s = startOfMonth(ref);
    const e = endOfMonth(ref);
    const [r, d] = await Promise.all([
      revenueInRange(s, e),
      expensesInRange(s, e),
    ]);
    months.push({
      label: format(ref, "MMM", { locale: ptBR }).replace(".", ""),
      receita: r,
      despesa: d,
    });
  }

  const statusMap = { PAID: 0, PENDING: 0, OVERDUE: 0, CANCELED: 0 } as Record<
    string,
    number
  >;
  for (const s of statusCounts) statusMap[s.status] = s._count._all;
  const totalInvoices =
    statusMap.PAID + statusMap.PENDING + statusMap.OVERDUE;

  return {
    revenue,
    revenueVar: variation(revenue, prevRevenue),
    mrr,
    expenses,
    expensesVar: variation(expenses, prevExpenses),
    profit: revenue - expenses,
    months,
    invoiceStatus: {
      paid: statusMap.PAID,
      pending: statusMap.PENDING,
      overdue: statusMap.OVERDUE,
      total: totalInvoices,
    },
  };
}

export async function getRecentInvoices(limit = 4) {
  return prisma.invoice.findMany({
    where: { status: { in: ["PENDING", "OVERDUE", "PAID"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { client: true, product: true },
  });
}

export async function getUpcomingInvoices(limit = 6) {
  return prisma.invoice.findMany({
    where: { status: { in: ["PENDING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    take: limit,
    include: { client: true, product: true },
  });
}
