import { Ban, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { Pagination } from "@/components/Pagination";
import { createSubscription, cancelSubscription, deleteSubscription } from "../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const subStatus: Record<string, string> = {
  ACTIVE: "badge-paid",
  PAUSED: "badge-pending",
  CANCELED: "badge-overdue",
};

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, subs, clients, products] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, product: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefForPage = (p: number) => `/assinaturas?page=${p}`;
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        subtitle="Planos recorrentes — geram cobrança automática todo ciclo."
      />

      <form action={createSubscription} className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select name="clientId" required className="input">
            <option value="">Cliente</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="productId" required className="input">
            <option value="">Produto / Serviço</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input name="amount" type="number" step="0.01" placeholder="Valor (opcional)" className="input" />
          <select name="cycle" className="input">
            <option value="MONTHLY">Mensal</option>
            <option value="YEARLY">Anual</option>
          </select>
          <input name="startDate" type="date" required min={today} defaultValue={today} title="Data da 1ª cobrança" className="input" />
        </div>
        <p className="text-xs text-slate-500">
          📅 A <span className="text-slate-300">data acima</span> é a da <span className="text-slate-300">1ª cobrança</span>:
          escolha um dia <span className="text-slate-300">deste mês</span> para começar a cobrar agora, ou do
          <span className="text-slate-300"> mês seguinte</span> para começar depois. As próximas seguem o mesmo dia, a cada ciclo.
        </p>
        <button className="btn-primary">+ Criar assinatura</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Produto</th>
              <th className="pb-3 pr-4 font-medium">Valor</th>
              <th className="pb-3 pr-4 font-medium">Ciclo</th>
              <th className="pb-3 pr-4 font-medium">Próx. vencimento</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {subs.map((s) => (
              <tr key={s.id} className="text-slate-300">
                <td className="py-3.5 pr-4 font-medium text-white">{s.client.name}</td>
                <td className="py-3.5 pr-4">{s.product.name}</td>
                <td className="py-3.5 pr-4 font-semibold text-white">{formatCurrency(s.amount)}</td>
                <td className="py-3.5 pr-4">{s.cycle === "YEARLY" ? "Anual" : "Mensal"}</td>
                <td className="py-3.5 pr-4">{formatDate(s.nextDueDate)}</td>
                <td className="py-3.5 pr-4">
                  <span className={`badge ${subStatus[s.status]}`}>
                    {s.status === "ACTIVE" ? "Ativa" : s.status === "PAUSED" ? "Pausada" : "Cancelada"}
                  </span>
                </td>
                <td className="py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    {s.status !== "CANCELED" && (
                      <form action={cancelSubscription} className="inline-block">
                        <input type="hidden" name="subscriptionId" value={s.id} />
                        <button
                          title="Cancelar assinatura (para as cobranças automáticas)"
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 px-2.5 text-xs font-medium text-slate-300 hover:bg-ink-800"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancelar
                        </button>
                      </form>
                    )}
                    <form action={deleteSubscription} className="inline-block">
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <button
                        title="Excluir assinatura"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-negative/15 text-negative hover:bg-negative/25"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">Nenhuma assinatura cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} totalItems={total} hrefForPage={hrefForPage} />
      </div>
    </div>
  );
}
