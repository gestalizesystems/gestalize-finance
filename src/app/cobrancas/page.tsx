import Link from "next/link";
import { ExternalLink, Play, Mail, MessageCircle, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { gatewayMode } from "@/lib/asaas";
import { PageHeader, InvoiceStatusBadge } from "@/components/ui";
import { Pagination } from "@/components/Pagination";
import {
  markPaid,
  runBilling,
  sendInvoiceEmail,
  sendInvoiceWhatsApp,
  deleteInvoice,
} from "../actions";
import { NewInvoiceForm } from "@/components/NewInvoiceForm";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, invoices, clients, openAgg] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.findMany({
      orderBy: { dueDate: "desc" },
      include: { client: true, product: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "OVERDUE"] } },
    }),
  ]);

  const totalOpen = toNumber(openAgg._sum.amount);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefForPage = (p: number) => `/cobrancas?page=${p}`;

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
      <NewInvoiceForm clients={clients} />

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
                  <div className="flex items-center gap-2">
                    {inv.client.phone && inv.status !== "PAID" && inv.status !== "CANCELED" && (
                      <form action={sendInvoiceWhatsApp}>
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <button
                          title={`Enviar cobrança por WhatsApp para ${inv.client.phone}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-positive/15 text-positive hover:bg-positive/25"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                    {inv.client.email && inv.status !== "PAID" && inv.status !== "CANCELED" && (
                      <form action={sendInvoiceEmail}>
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <button
                          title={`Enviar cobrança por e-mail para ${inv.client.email}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand-400 hover:bg-brand/25"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </form>
                    )}
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
                    <form action={deleteInvoice}>
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <button
                        title="Excluir cobrança"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-negative/15 text-negative hover:bg-negative/25"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} totalItems={total} hrefForPage={hrefForPage} />
      </div>
    </div>
  );
}
