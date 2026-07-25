import Link from "next/link";
import {
  DollarSign,
  RefreshCw,
  Receipt,
  Plus,
  Copy,
  MessageCircle,
  Mail,
  MoreVertical,
} from "lucide-react";
import {
  getDashboardMetrics,
  getRecentInvoices,
  getUpcomingInvoices,
  getMonthsWithData,
} from "@/lib/metrics";
import { getNotifications } from "@/lib/notifications";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard, InvoiceStatusBadge } from "@/components/ui";
import { RevenueExpenseChart, StatusDonut, MrrTrendChart } from "@/components/charts";
import { BillingFlow, AutomationPanel } from "@/components/dashboard-panels";
import { MonthFilter } from "@/components/MonthFilter";
import { NotificationsBell } from "@/components/NotificationsBell";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const month = searchParams.month;
  const refDate = month
    ? new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1, 1)
    : new Date();

  const [metrics, recent, upcoming, monthsWithData, notifications] = await Promise.all([
    getDashboardMetrics(refDate),
    getRecentInvoices(4),
    getUpcomingInvoices(3),
    getMonthsWithData(),
    getNotifications(12),
  ]);

  const { paid, pending, overdue, total } = metrics.invoiceStatus;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
            Olá, Gestalize! <span>👋</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Aqui está o resumo financeiro do seu negócio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <MonthFilter months={monthsWithData} allLabel="Mês atual" />
          <NotificationsBell items={notifications} count={pending + overdue} />
          <Link href="/cobrancas" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nova Cobrança
          </Link>
        </div>
      </div>

      {/* Linha 1: cards + fluxo */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <StatCard
            title="Receita Total"
            value={formatCurrency(metrics.revenue)}
            icon={<DollarSign className="h-5 w-5" />}
            accent="brand"
            variation={metrics.revenueVar}
          />
        </div>
        <div className="lg:col-span-3">
          <StatCard
            title="Receita Recorrente (MRR)"
            value={formatCurrency(metrics.mrr)}
            icon={<RefreshCw className="h-5 w-5" />}
            accent="positive"
          />
        </div>
        <div className="lg:col-span-3">
          <StatCard
            title="Despesas"
            value={formatCurrency(metrics.expenses)}
            icon={<Receipt className="h-5 w-5" />}
            accent="negative"
            variation={metrics.expensesVar}
          />
        </div>
        <div className="lg:col-span-3">
          <BillingFlow />
        </div>
      </div>

      {/* Linha 2: gráficos + automação */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="card md:col-span-7">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Receitas vs Despesas</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Receitas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-negative" /> Despesas
                  </span>
                </div>
              </div>
              <RevenueExpenseChart data={metrics.months} />
            </div>

            <div className="card md:col-span-5">
              <h3 className="mb-2 font-semibold text-white">Cobranças por Status</h3>
              <StatusDonut paid={paid} pending={pending} overdue={overdue} />
              <div className="mt-2 space-y-1.5 text-sm">
                <StatusLegend color="bg-brand" label="Pagas" value={paid} pct={pct(paid)} />
                <StatusLegend color="bg-warning" label="Pendentes" value={pending} pct={pct(pending)} />
                <StatusLegend color="bg-negative" label="Atrasadas" value={overdue} pct={pct(overdue)} />
              </div>
            </div>
          </div>

          {/* Cobranças recentes + MRR */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Cobranças Recentes</h3>
                <Link href="/cobrancas" className="text-xs font-medium text-brand-400 hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="space-y-3">
                {recent.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-800 text-xs font-bold text-slate-300">
                        {inv.client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {inv.product?.name ?? inv.description}
                        </p>
                        <p className="truncate text-xs text-slate-500">{inv.client.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(inv.amount)}</p>
                      <div className="mt-0.5">
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-semibold text-white">Receita Recorrente (MRR)</h3>
                <Link href="/relatorios" className="text-xs font-medium text-brand-400 hover:underline">
                  Ver relatório
                </Link>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(metrics.mrr)}</p>
              <div className="mt-2">
                <MrrTrendChart data={metrics.months} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <AutomationPanel />
        </div>
      </div>

      {/* Linha 3: próximas cobranças */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Próximas Cobranças</h3>
          <Link href="/cobrancas" className="text-xs font-medium text-brand-400 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-medium">Cliente</th>
                <th className="pb-3 pr-4 font-medium">Serviço</th>
                <th className="pb-3 pr-4 font-medium">Valor</th>
                <th className="pb-3 pr-4 font-medium">Vencimento</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/40">
              {upcoming.map((inv) => (
                <tr key={inv.id} className="text-slate-300">
                  <td className="py-3.5 pr-4 font-medium text-white">{inv.client.name}</td>
                  <td className="py-3.5 pr-4">{inv.product?.name ?? "—"}</td>
                  <td className="py-3.5 pr-4 font-semibold text-white">{formatCurrency(inv.amount)}</td>
                  <td className="py-3.5 pr-4">{formatDate(inv.dueDate)}</td>
                  <td className="py-3.5 pr-4">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Copy className="h-4 w-4 cursor-pointer hover:text-white" />
                      <MessageCircle className="h-4 w-4 cursor-pointer hover:text-positive" />
                      <Mail className="h-4 w-4 cursor-pointer hover:text-brand-400" />
                      <MoreVertical className="h-4 w-4 cursor-pointer hover:text-white" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusLegend({
  color,
  label,
  value,
  pct,
}: {
  color: string;
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-300">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-slate-400">
        {value} ({pct}%)
      </span>
    </div>
  );
}
