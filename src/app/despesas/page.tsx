import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { createCost } from "../actions";

export const dynamic = "force-dynamic";

const categoryLabel: Record<string, string> = {
  PER_CLIENT: "Por cliente",
  API: "API / Ferramenta",
  SERVER: "Servidor",
  COMMISSION: "Comissão",
  FIXED: "Custo fixo",
  VARIABLE: "Custo variável",
  OTHER: "Outro",
};

export default async function DespesasPage() {
  const [costs, clients] = await Promise.all([
    prisma.cost.findMany({ orderBy: { date: "desc" }, include: { client: true } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  const total = costs.reduce((acc, c) => acc + toNumber(c.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Despesas" subtitle="Custos por sistema, ferramentas, servidores e fixos." />

      <form action={createCost} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
        <input name="description" required placeholder="Descrição do custo" className="input md:col-span-2" />
        <input name="amount" type="number" step="0.01" required placeholder="Valor (R$)" className="input" />
        <select name="category" className="input">
          {Object.entries(categoryLabel).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="clientId" className="input">
          <option value="">Sem cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="recurring" className="h-4 w-4 rounded border-ink-700 bg-ink-900" />
          Recorrente
        </label>
        <button className="btn-primary md:col-span-6 md:justify-self-start">+ Adicionar despesa</button>
      </form>

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">Histórico</h3>
          <span className="text-sm text-slate-400">
            Total: <span className="font-semibold text-negative">{formatCurrency(total)}</span>
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Descrição</th>
              <th className="pb-3 pr-4 font-medium">Categoria</th>
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Data</th>
              <th className="pb-3 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {costs.map((c) => (
              <tr key={c.id} className="text-slate-300">
                <td className="py-3.5 pr-4 font-medium text-white">
                  {c.description}
                  {c.recurring && <span className="badge badge-paid ml-2">Recorrente</span>}
                </td>
                <td className="py-3.5 pr-4">{categoryLabel[c.category]}</td>
                <td className="py-3.5 pr-4">{c.client?.name ?? "—"}</td>
                <td className="py-3.5 pr-4">{formatDate(c.date)}</td>
                <td className="py-3.5 text-right font-semibold text-negative">{formatCurrency(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
