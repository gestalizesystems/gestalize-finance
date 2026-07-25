import {
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Ticket,
} from "lucide-react";
import { getReportData } from "@/lib/metrics";
import { formatCurrency } from "@/lib/utils";
import { StatCard, PageHeader } from "@/components/ui";
import { ProfitChart, RevenueTypeDonut } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const r = await getReportData();
  const typeTotal =
    r.revenueByType.SUBSCRIPTION + r.revenueByType.IMPLEMENTATION + r.revenueByType.EXTRA;
  const maxClient = Math.max(1, ...r.topClients.map((c) => c.revenue));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Visão financeira do negócio: faturamento, MRR, lucro e inadimplência."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Faturamento total" value={formatCurrency(r.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} accent="positive" />
        <StatCard title="MRR" value={formatCurrency(r.mrr)} icon={<RefreshCw className="h-5 w-5" />} accent="brand" />
        <StatCard title="ARR (anual)" value={formatCurrency(r.arr)} icon={<TrendingUp className="h-5 w-5" />} accent="brand" />
        <StatCard title="Lucro do mês" value={formatCurrency(r.netProfitMonth)} icon={<Wallet className="h-5 w-5" />} accent={r.netProfitMonth >= 0 ? "positive" : "negative"} />
        <StatCard title="Inadimplência" value={formatCurrency(r.overdue.amount)} icon={<AlertTriangle className="h-5 w-5" />} accent="negative" />
        <StatCard title="Ticket médio" value={formatCurrency(r.avgTicket)} icon={<Ticket className="h-5 w-5" />} accent="brand" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">Receita, Despesa e Lucro (6 meses)</h3>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Receita</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-negative" /> Despesa</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-positive" /> Lucro</span>
            </div>
          </div>
          <ProfitChart data={r.months} />
        </div>

        <div className="card">
          <h3 className="mb-2 font-semibold text-white">Receita por tipo</h3>
          <RevenueTypeDonut
            implementation={r.revenueByType.IMPLEMENTATION}
            subscription={r.revenueByType.SUBSCRIPTION}
            extra={r.revenueByType.EXTRA}
          />
          <div className="mt-2 space-y-1.5 text-sm">
            <TypeRow color="bg-brand" label="Mensalidades" value={r.revenueByType.SUBSCRIPTION} total={typeTotal} />
            <TypeRow color="bg-positive" label="Implementação" value={r.revenueByType.IMPLEMENTATION} total={typeTotal} />
            <TypeRow color="bg-warning" label="Avulsos" value={r.revenueByType.EXTRA} total={typeTotal} />
          </div>
        </div>
      </div>

      {/* Top clientes */}
      <div className="card">
        <h3 className="mb-4 font-semibold text-white">Top clientes por receita</h3>
        {r.topClients.length === 0 ? (
          <p className="text-sm text-slate-500">Sem receitas registradas ainda.</p>
        ) : (
          <div className="space-y-3">
            {r.topClients.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm font-medium text-white">{c.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(c.revenue / maxClient) * 100}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-sm font-semibold text-white">{formatCurrency(c.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypeRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-300">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-slate-400">{formatCurrency(value)} ({pct}%)</span>
    </div>
  );
}
