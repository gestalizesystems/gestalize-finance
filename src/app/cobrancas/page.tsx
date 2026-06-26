import Link from "next/link";
import { ExternalLink, Play } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { gatewayMode } from "@/lib/asaas";
import { PageHeader, InvoiceStatusBadge } from "@/components/ui";
import { createInvoice, markPaid, runBilling } from "../actions";

export const dynamic = "force-dynamic";

export default async function CobrancasPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { dueDate: "desc" },
      include: { client: true, product: true },
      take: 100,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  const open = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE");
  const totalOpen = open.reduce((acc, i) => acc + toNumber(i.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranças"
        subtitle={`Gateway: ${gatewayMode().toUpperCase()} · Em aberto: ${formatCurrency(totalOpen)}`}
        action={
          <form action={runBilling}>
            <button className="btn-ghost">
              <Play className="h-4 w-4" /> Rodar motor de cobrança
            </button>
          </form>
        }
      />

      {/* Nova cobrança avulsa */}
      <form action={createInvoice} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
        <select name="clientId" required className="input md:col-span-2">
          <option value="">Selecione o cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="description" required placeholder="Descrição (ex: Implementação)" className="input md:col-span-2" />
        <input name="amount" type="number" step="0.01" required placeholder="Valor (R$)" className="input" />
        <input name="dueDate" type="date" required className="input" />
        <select name="type" className="input md:col-span-2">
          <option value="IMPLEMENTATION">Implementação</option>
          <option value="EXTRA">Avulso / Upgrade</option>
          <option value="SUBSCRIPTION">Mensalidade</option>
        </select>
        <button className="btn-primary md:col-span-4 md:justify-self-start">
          + Gerar cobrança (com link de pagamento)
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Descrição</th>
              <th className="pb-3 pr-4 font-medium">Valor</th>
              <th className="pb-3 pr-4 font-medium">Vencimento</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Link</th>
              <th className="pb-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {invoices.map((inv) => (
              <tr key={inv.id} className="text-slate-300">
                <td className="py-3.5 pr-4 font-medium text-white">{inv.client.name}</td>
                <td className="py-3.5 pr-4">{inv.description}</td>
                <td className="py-3.5 pr-4 font-semibold text-white">{formatCurrency(inv.amount)}</td>
                <td className="py-3.5 pr-4">{formatDate(inv.dueDate)}</td>
                <td className="py-3.5 pr-4"><InvoiceStatusBadge status={inv.status} /></td>
                <td className="py-3.5 pr-4">
                  {inv.paymentLink ? (
                    <Link href={inv.paymentLink} target="_blank" className="inline-flex items-center gap-1 text-brand-400 hover:underline">
                      Abrir <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-3.5">
                  {inv.status !== "PAID" && inv.status !== "CANCELED" ? (
                    <form action={markPaid}>
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <button className="rounded-lg bg-positive/15 px-2.5 py-1 text-xs font-semibold text-positive hover:bg-positive/25">
                        Dar baixa
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-slate-500">{inv.paidAt ? formatDate(inv.paidAt) : "Pago"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
