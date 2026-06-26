import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { createSubscription } from "../actions";

export const dynamic = "force-dynamic";

const subStatus: Record<string, string> = {
  ACTIVE: "badge-paid",
  PAUSED: "badge-pending",
  CANCELED: "badge-overdue",
};

export default async function AssinaturasPage() {
  const [subs, clients, products] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, product: true },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        subtitle="Planos recorrentes — geram cobrança automática todo ciclo."
      />

      <form action={createSubscription} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
        <select name="clientId" required className="input md:col-span-2">
          <option value="">Cliente</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="productId" required className="input md:col-span-2">
          <option value="">Produto / Serviço</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Valor (opcional)" className="input" />
        <select name="cycle" className="input">
          <option value="MONTHLY">Mensal</option>
          <option value="YEARLY">Anual</option>
        </select>
        <input name="dueDay" type="number" min={1} max={28} defaultValue={5} placeholder="Dia venc." className="input" />
        <button className="btn-primary md:col-span-5 md:justify-self-start">+ Criar assinatura</button>
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
              <th className="pb-3 font-medium">Status</th>
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
                <td className="py-3.5">
                  <span className={`badge ${subStatus[s.status]}`}>
                    {s.status === "ACTIVE" ? "Ativa" : s.status === "PAUSED" ? "Pausada" : "Cancelada"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
