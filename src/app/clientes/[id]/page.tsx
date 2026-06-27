import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Rocket,
  TrendingDown,
  Wallet,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { displayPhone, displayDocument } from "@/lib/masks";
import { StatCard, InvoiceStatusBadge, ClientStatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  IMPLEMENTATION: "Implementação",
  SUBSCRIPTION: "Mensalidade",
  EXTRA: "Avulso",
};

const costCategoryLabel: Record<string, string> = {
  PER_CLIENT: "Por cliente",
  API: "API / Ferramenta",
  SERVER: "Servidor",
  COMMISSION: "Comissão",
  FIXED: "Custo fixo",
  VARIABLE: "Custo variável",
  OTHER: "Outro",
};

export default async function ClienteResumoPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [
    subscriptions,
    invoices,
    costs,
    receivedAgg,
    implAgg,
    openAgg,
    costsAgg,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: { clientId: id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { clientId: id },
      orderBy: { dueDate: "desc" },
      take: 20,
      include: { product: true },
    }),
    prisma.cost.findMany({
      where: { clientId: id },
      orderBy: { date: "desc" },
      take: 20,
      include: { product: true },
    }),
    // Receita recebida (pagamentos confirmados)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { invoice: { clientId: id } },
    }),
    // Implementação recebida
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { clientId: id, type: "IMPLEMENTATION", status: "PAID" },
    }),
    // Em aberto (pendente + atrasado)
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { clientId: id, status: { in: ["PENDING", "OVERDUE"] } },
    }),
    // Despesas do cliente
    prisma.cost.aggregate({ _sum: { amount: true }, where: { clientId: id } }),
  ]);

  const received = toNumber(receivedAgg._sum.amount);
  const implementation = toNumber(implAgg._sum.amount);
  const open = toNumber(openAgg._sum.amount);
  const totalCosts = toNumber(costsAgg._sum.amount);
  const profit = received - totalCosts;

  // MRR do cliente (assinaturas ativas normalizadas p/ mês)
  const mrr = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce(
      (acc, s) => acc + (s.cycle === "YEARLY" ? toNumber(s.amount) / 12 : toNumber(s.amount)),
      0,
    );

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="card flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-xl font-bold text-brand-400">
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
              {client.email && (
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {client.email}</span>
              )}
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {displayPhone(client.phone)}</span>
              {client.document && (
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {displayDocument(client.document)}</span>
              )}
            </div>
          </div>
        </div>
        <Link href="/cobrancas" className="btn-ghost">Nova cobrança</Link>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Receita recebida" value={formatCurrency(received)} icon={<DollarSign className="h-5 w-5" />} accent="positive" />
        <StatCard title="Mensalidades (MRR)" value={formatCurrency(mrr)} icon={<RefreshCw className="h-5 w-5" />} accent="brand" />
        <StatCard title="Implantação" value={formatCurrency(implementation)} icon={<Rocket className="h-5 w-5" />} accent="brand" />
        <StatCard title="Despesas" value={formatCurrency(totalCosts)} icon={<TrendingDown className="h-5 w-5" />} accent="negative" />
        <StatCard
          title="Lucro do cliente"
          value={formatCurrency(profit)}
          icon={<Wallet className="h-5 w-5" />}
          accent={profit >= 0 ? "positive" : "negative"}
        />
      </div>

      {open > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Este cliente tem <span className="font-semibold">{formatCurrency(open)}</span> em cobranças em aberto.
        </div>
      )}

      {/* Projetos / Assinaturas */}
      <div className="card">
        <h3 className="mb-4 font-semibold text-white">Projetos / Assinaturas</h3>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma assinatura para este cliente.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((s) => (
              <div key={s.id} className="rounded-xl border border-ink-700 bg-ink-900 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-white">{s.product.name}</p>
                  <span className={`badge ${s.status === "ACTIVE" ? "badge-paid" : s.status === "PAUSED" ? "badge-pending" : "badge-overdue"}`}>
                    {s.status === "ACTIVE" ? "Ativa" : s.status === "PAUSED" ? "Pausada" : "Cancelada"}
                  </span>
                </div>
                <p className="mt-2 text-lg font-bold text-white">
                  {formatCurrency(s.amount)}
                  <span className="text-xs font-normal text-slate-500">/{s.cycle === "YEARLY" ? "ano" : "mês"}</span>
                </p>
                <p className="text-xs text-slate-500">Próx. vencimento: {formatDate(s.nextDueDate)}</p>
                {s.product.implementationPrice && (
                  <p className="text-xs text-slate-500">Implantação: {formatCurrency(s.product.implementationPrice)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cobranças */}
        <div className="card overflow-x-auto">
          <h3 className="mb-4 font-semibold text-white">Cobranças</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-medium">Descrição</th>
                <th className="pb-3 pr-4 font-medium">Tipo</th>
                <th className="pb-3 pr-4 font-medium">Venc.</th>
                <th className="pb-3 pr-4 font-medium">Valor</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/40">
              {invoices.map((inv) => (
                <tr key={inv.id} className="text-slate-300">
                  <td className="py-3 pr-4 text-white">{inv.description}</td>
                  <td className="py-3 pr-4">{typeLabel[inv.type]}</td>
                  <td className="py-3 pr-4">{formatDate(inv.dueDate)}</td>
                  <td className="py-3 pr-4 font-semibold text-white">{formatCurrency(inv.amount)}</td>
                  <td className="py-3"><InvoiceStatusBadge status={inv.status} /></td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">Sem cobranças.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Despesas do cliente */}
        <div className="card overflow-x-auto">
          <h3 className="mb-4 font-semibold text-white">Despesas do cliente</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-medium">Descrição</th>
                <th className="pb-3 pr-4 font-medium">Categoria</th>
                <th className="pb-3 pr-4 font-medium">Data</th>
                <th className="pb-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/40">
              {costs.map((c) => (
                <tr key={c.id} className="text-slate-300">
                  <td className="py-3 pr-4 text-white">{c.description}</td>
                  <td className="py-3 pr-4">{costCategoryLabel[c.category]}</td>
                  <td className="py-3 pr-4">{formatDate(c.date)}</td>
                  <td className="py-3 text-right font-semibold text-negative">{formatCurrency(c.amount)}</td>
                </tr>
              ))}
              {costs.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">Sem despesas vinculadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
