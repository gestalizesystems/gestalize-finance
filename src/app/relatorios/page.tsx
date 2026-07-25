import Link from "next/link";
import {
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Ticket,
  FileText,
} from "lucide-react";
import { getReportData, defaultReportRange } from "@/lib/metrics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard, PageHeader } from "@/components/ui";
import { ProfitChart, RevenueTypeDonut } from "@/components/charts";
import { DateRangeFilter } from "@/components/ReportControls";

export const dynamic = "force-dynamic";

const COMPANY = process.env.COMPANY_NAME || "Gestalize Systems";

function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const def = defaultReportRange();
  const start = searchParams.start ? new Date(`${searchParams.start}T00:00:00`) : def.start;
  const end = searchParams.end ? new Date(`${searchParams.end}T23:59:59`) : def.end;

  const r = await getReportData(start, end);
  const typeTotal =
    r.revenueByType.SUBSCRIPTION + r.revenueByType.IMPLEMENTATION + r.revenueByType.EXTRA;
  const maxClient = Math.max(1, ...r.topClients.map((c) => c.revenue));

  return (
    <div className="report space-y-6">
      {/* Cabeçalho de tela (não imprime) */}
      <div className="no-print">
        <PageHeader
          title="Relatórios"
          subtitle="Faturamento, MRR, lucro e inadimplência no período."
          action={
            <div className="flex flex-wrap items-end gap-3">
              <DateRangeFilter start={toInputDate(start)} end={toInputDate(end)} />
              <Link
                href={`/relatorios/documento?start=${toInputDate(start)}&end=${toInputDate(end)}`}
                target="_blank"
                className="btn-primary"
              >
                <FileText className="h-4 w-4" /> Gerar PDF
              </Link>
            </div>
          }
        />
      </div>

      {/* Cabeçalho do documento (só na impressão) */}
      <div className="print-only mb-2 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold">{COMPANY}</h1>
        <p className="text-lg font-semibold">Relatório Financeiro</p>
        <p className="text-sm">
          Período: {formatDate(start)} a {formatDate(end)} · Emitido em {formatDate(new Date())}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Faturamento (período)" value={formatCurrency(r.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} accent="positive" />
        <StatCard title="MRR (atual)" value={formatCurrency(r.mrr)} icon={<RefreshCw className="h-5 w-5" />} accent="brand" />
        <StatCard title="ARR (anual)" value={formatCurrency(r.arr)} icon={<TrendingUp className="h-5 w-5" />} accent="brand" />
        <StatCard title="Lucro (período)" value={formatCurrency(r.netProfit)} icon={<Wallet className="h-5 w-5" />} accent={r.netProfit >= 0 ? "positive" : "negative"} />
        <StatCard title="Inadimplência" value={formatCurrency(r.overdue.amount)} icon={<AlertTriangle className="h-5 w-5" />} accent="negative" />
        <StatCard title="Ticket médio" value={formatCurrency(r.avgTicket)} icon={<Ticket className="h-5 w-5" />} accent="brand" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">Receita, Despesa e Lucro</h3>
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
            <TypeRow color="bg-positive" label="Implantação" value={r.revenueByType.IMPLEMENTATION} total={typeTotal} />
            <TypeRow color="bg-warning" label="Avulsos" value={r.revenueByType.EXTRA} total={typeTotal} />
          </div>
        </div>
      </div>

      {/* Tabela mês a mês (boa para impressão) */}
      <div className="card overflow-x-auto">
        <h3 className="mb-4 font-semibold text-white">Resumo mês a mês</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Mês</th>
              <th className="pb-3 pr-4 font-medium text-right">Receita</th>
              <th className="pb-3 pr-4 font-medium text-right">Despesa</th>
              <th className="pb-3 font-medium text-right">Lucro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {r.months.map((m) => (
              <tr key={m.label} className="text-slate-300">
                <td className="py-2.5 pr-4 font-medium text-white capitalize">{m.label}</td>
                <td className="py-2.5 pr-4 text-right text-positive">{formatCurrency(m.receita)}</td>
                <td className="py-2.5 pr-4 text-right text-negative">{formatCurrency(m.despesa)}</td>
                <td className={`py-2.5 text-right font-semibold ${m.lucro >= 0 ? "text-white" : "text-negative"}`}>{formatCurrency(m.lucro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top clientes */}
      <div className="card">
        <h3 className="mb-4 font-semibold text-white">Top clientes por receita</h3>
        {r.topClients.length === 0 ? (
          <p className="text-sm text-slate-500">Sem receitas no período.</p>
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
