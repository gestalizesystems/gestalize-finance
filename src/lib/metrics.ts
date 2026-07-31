// Agregações financeiras para o dashboard.
import { prisma } from "./prisma";
import { toNumber, variation } from "./utils";

function mStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function mEnd(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function mAdd(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }
function mLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
}
function mLabelYear(d: Date) {
  const m = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
  return `${m}/${String(d.getFullYear()).slice(2)}`;
}

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

// Meses que têm movimentação (pagamentos ou despesas) — p/ os filtros de mês.
export async function getMonthsWithData(): Promise<{ value: string; label: string }[]> {
  const [payments, costs] = await Promise.all([
    prisma.payment.findMany({ select: { paidAt: true } }),
    prisma.cost.findMany({ select: { date: true } }),
  ]);
  const set = new Set<string>();
  const add = (d: Date) =>
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  for (const p of payments) add(p.paidAt);
  for (const c of costs) add(c.date);
  return Array.from(set)
    .sort()
    .reverse()
    .map((v) => {
      const [y, m] = v.split("-").map(Number);
      const label = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(new Date(y, m - 1, 1));
      return { value: v, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });
}

export async function getDashboardMetrics(refDate: Date = new Date()) {
  const now = refDate;
  const monthStart = mStart(now);
  const monthEnd = mEnd(now);
  const prevStart = mStart(mAdd(now, -1));
  const prevEnd = mEnd(mAdd(now, -1));

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
    const ref = mAdd(now, -i);
    const s = mStart(ref);
    const e = mEnd(ref);
    const [r, d] = await Promise.all([
      revenueInRange(s, e),
      expensesInRange(s, e),
    ]);
    months.push({ label: mLabel(ref), receita: r, despesa: d });
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

// ----------------------- RELATÓRIOS -----------------------

// Período padrão dos relatórios: últimos 6 meses.
export function defaultReportRange() {
  const now = new Date();
  return { start: mStart(mAdd(now, -5)), end: mEnd(now) };
}

export async function getReportData(start: Date, end: Date) {
  const paidInRange = { status: "PAID" as const, paidAt: { gte: start, lte: end } };

  const [
    rangeRevenue,
    rangeExpenses,
    mrr,
    overdueAgg,
    avgTicketAgg,
    revenueByTypeRaw,
    topClientsRaw,
  ] = await Promise.all([
    revenueInRange(start, end),
    expensesInRange(start, end),
    getMRR(),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: { status: "OVERDUE" },
    }),
    prisma.invoice.aggregate({ _avg: { amount: true }, where: paidInRange }),
    prisma.invoice.groupBy({
      by: ["type"],
      _sum: { amount: true },
      where: paidInRange,
    }),
    prisma.invoice.groupBy({
      by: ["clientId"],
      _sum: { amount: true },
      where: paidInRange,
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
  ]);

  // Histórico mês a mês dentro do período (limite de 24 meses).
  const months: {
    label: string;
    receita: number;
    despesa: number;
    lucro: number;
  }[] = [];
  let ref = mStart(start);
  const lastMonth = mStart(end);
  let guard = 0;
  while (ref <= lastMonth && guard < 24) {
    const s = mStart(ref);
    const e = mEnd(ref);
    const [r, d] = await Promise.all([
      revenueInRange(s, e),
      expensesInRange(s, e),
    ]);
    months.push({ label: mLabelYear(ref), receita: r, despesa: d, lucro: r - d });
    ref = mAdd(ref, 1);
    guard++;
  }

  const revenueByType = { IMPLEMENTATION: 0, SUBSCRIPTION: 0, EXTRA: 0 } as Record<
    string,
    number
  >;
  for (const row of revenueByTypeRaw)
    revenueByType[row.type] = toNumber(row._sum.amount);

  // Nomes dos top clientes
  const clientIds = topClientsRaw.map((c) => c.clientId);
  const clientsMap = new Map<string, string>();
  if (clientIds.length) {
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    });
    for (const c of clients) clientsMap.set(c.id, c.name);
  }
  const topClients = topClientsRaw.map((c) => ({
    name: clientsMap.get(c.clientId) ?? "—",
    revenue: toNumber(c._sum.amount),
  }));

  const mrrValue = mrr;
  return {
    totalRevenue: rangeRevenue,
    expenses: rangeExpenses,
    netProfit: rangeRevenue - rangeExpenses,
    mrr: mrrValue,
    arr: mrrValue * 12,
    overdue: {
      amount: toNumber(overdueAgg._sum.amount),
      count: overdueAgg._count._all,
    },
    avgTicket: toNumber(avgTicketAgg._avg.amount),
    months,
    revenueByType,
    topClients,
  };
}
