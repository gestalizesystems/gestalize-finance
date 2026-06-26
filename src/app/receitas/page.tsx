import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, InvoiceStatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  IMPLEMENTATION: "Implementação",
  SUBSCRIPTION: "Mensalidade",
  EXTRA: "Avulso",
};

export default async function ReceitasPage() {
  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: 100,
    include: { client: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Receitas" subtitle="Entradas confirmadas: implementação, mensalidades e avulsos." />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Descrição</th>
              <th className="pb-3 pr-4 font-medium">Tipo</th>
              <th className="pb-3 pr-4 font-medium">Pago em</th>
              <th className="pb-3 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {invoices.map((inv) => (
              <tr key={inv.id} className="text-slate-300">
                <td className="py-3.5 pr-4 font-medium text-white">{inv.client.name}</td>
                <td className="py-3.5 pr-4">{inv.description}</td>
                <td className="py-3.5 pr-4">{typeLabel[inv.type]}</td>
                <td className="py-3.5 pr-4">{inv.paidAt ? formatDate(inv.paidAt) : "—"}</td>
                <td className="py-3.5 text-right font-semibold text-positive">{formatCurrency(inv.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
