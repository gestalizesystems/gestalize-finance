import { getReportData, defaultReportRange } from "@/lib/metrics";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { displayDocument } from "@/lib/masks";
import { ReportDocToolbar } from "@/components/ReportDocToolbar";

export const dynamic = "force-dynamic";

export default async function RelatorioDocumentoPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const def = defaultReportRange();
  const start = searchParams.start ? new Date(`${searchParams.start}T00:00:00`) : def.start;
  const end = searchParams.end ? new Date(`${searchParams.end}T23:59:59`) : def.end;
  const qs = `start=${searchParams.start ?? ""}&end=${searchParams.end ?? ""}`;

  const [r, cfg] = await Promise.all([
    getReportData(start, end),
    getSettings([
      SETTING_KEYS.companyName,
      SETTING_KEYS.companyCnpj,
      SETTING_KEYS.companyEmail,
      SETTING_KEYS.companyPhone,
    ]),
  ]);

  const typeTotal =
    r.revenueByType.SUBSCRIPTION + r.revenueByType.IMPLEMENTATION + r.revenueByType.EXTRA;

  const kpis = [
    { label: "Faturamento (período)", value: formatCurrency(r.totalRevenue) },
    { label: "Despesas (período)", value: formatCurrency(r.expenses) },
    { label: "Lucro (período)", value: formatCurrency(r.netProfit) },
    { label: "MRR (atual)", value: formatCurrency(r.mrr) },
    { label: "ARR (anual)", value: formatCurrency(r.arr) },
    { label: "Ticket médio", value: formatCurrency(r.avgTicket) },
    { label: "Inadimplência", value: `${formatCurrency(r.overdue.amount)} (${r.overdue.count})` },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900 print:bg-white print:py-0">
      <ReportDocToolbar backHref={`/relatorios?${qs}`} />

      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-start justify-between border-b border-slate-300 pb-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gestalize-bot.png" alt="" className="h-12 w-auto shrink-0" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{cfg[SETTING_KEYS.companyName]}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {cfg[SETTING_KEYS.companyCnpj] && <>CNPJ: {displayDocument(cfg[SETTING_KEYS.companyCnpj])} · </>}
                {cfg[SETTING_KEYS.companyEmail]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">Relatório Financeiro</p>
            <p className="text-xs text-slate-500">Emitido em {formatDate(new Date())}</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-600">
          <span className="font-semibold">Período:</span> {formatDate(start)} a {formatDate(end)}
        </p>

        {/* Resumo (KPIs) */}
        <Section title="Resumo do período">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{k.label}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">{k.value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Receita por tipo */}
        <Section title="Receita por tipo">
          <DocTable
            head={["Tipo", "Valor", "%"]}
            rows={[
              ["Mensalidades", formatCurrency(r.revenueByType.SUBSCRIPTION), pct(r.revenueByType.SUBSCRIPTION, typeTotal)],
              ["Implantação", formatCurrency(r.revenueByType.IMPLEMENTATION), pct(r.revenueByType.IMPLEMENTATION, typeTotal)],
              ["Avulsos", formatCurrency(r.revenueByType.EXTRA), pct(r.revenueByType.EXTRA, typeTotal)],
            ]}
          />
        </Section>

        {/* Mês a mês */}
        <Section title="Resumo mês a mês">
          <DocTable
            head={["Mês", "Receita", "Despesa", "Lucro"]}
            rows={r.months.map((m) => [m.label, formatCurrency(m.receita), formatCurrency(m.despesa), formatCurrency(m.lucro)])}
          />
        </Section>

        {/* Top clientes */}
        <Section title="Top clientes por receita">
          {r.topClients.length === 0 ? (
            <p className="text-sm text-slate-500">Sem receitas no período.</p>
          ) : (
            <DocTable
              head={["Cliente", "Receita"]}
              rows={r.topClients.map((c) => [c.name, formatCurrency(c.revenue)])}
            />
          )}
        </Section>

        <p className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Documento gerado por {cfg[SETTING_KEYS.companyName]} · Gestalize Finance
        </p>
      </div>
    </div>
  );
}

function pct(v: number, total: number) {
  return total ? `${Math.round((v / total) * 100)}%` : "0%";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function DocTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} className={`border-b-2 border-slate-300 py-2 text-slate-600 ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} className={`border-b border-slate-200 py-1.5 ${ci === 0 ? "text-left font-medium text-slate-800" : "text-right text-slate-700"}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
