import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { Pagination } from "@/components/Pagination";
import { createCost, deleteCost } from "../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const categoryLabel: Record<string, string> = {
  PER_CLIENT: "Por cliente",
  API: "API / Ferramenta",
  SERVER: "Servidor",
  COMMISSION: "Comissão",
  FIXED: "Custo fixo",
  VARIABLE: "Custo variável",
  OTHER: "Outro",
};

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, costs, clients, totalAgg] = await Promise.all([
    prisma.cost.count(),
    prisma.cost.findMany({
      orderBy: { date: "desc" },
      include: { client: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.cost.aggregate({ _sum: { amount: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalAmount = toNumber(totalAgg._sum.amount);
  const hrefForPage = (p: number) => `/despesas?page=${p}`;
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  return (
    <div className="space-y-6">
      <PageHeader title="Despesas" subtitle="Custos por sistema, ferramentas, servidores e fixos." />

      <form action={createCost} className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="description" required placeholder="Descrição do custo" className="input" />
          <input name="amount" type="number" step="0.01" required placeholder="Valor (R$)" className="input" />
          <select name="category" required defaultValue="" className="input">
            <option value="" disabled>Tipo de despesa</option>
            {Object.entries(categoryLabel).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select name="clientId" defaultValue="" className="input">
            <option value="">Cliente (opcional)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="date" type="date" required defaultValue={today} title="Data da despesa" className="input" />
          <label className="flex items-center gap-2 px-1 text-sm text-slate-300">
            <input type="checkbox" name="recurring" className="h-4 w-4 rounded border-ink-700 bg-ink-900" />
            Recorrente
          </label>
        </div>
        <button className="btn-primary">+ Adicionar despesa</button>
      </form>

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">Histórico</h3>
          <span className="text-sm text-slate-400">
            Total geral: <span className="font-semibold text-negative">{formatCurrency(totalAmount)}</span>
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Descrição</th>
              <th className="pb-3 pr-4 font-medium">Categoria</th>
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Data</th>
              <th className="pb-3 pr-4 font-medium text-right">Valor</th>
              <th className="pb-3 font-medium"></th>
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
                <td className="py-3.5 pr-4 text-right font-semibold text-negative">{formatCurrency(c.amount)}</td>
                <td className="py-3.5 text-right">
                  <form action={deleteCost} className="inline-block">
                    <input type="hidden" name="costId" value={c.id} />
                    <button
                      title="Excluir despesa"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-negative/15 text-negative hover:bg-negative/25"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {costs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">Nenhuma despesa registrada.</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} totalItems={total} hrefForPage={hrefForPage} />
      </div>
    </div>
  );
}
