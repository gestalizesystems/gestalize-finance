import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const methodLabel: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CARD: "Cartão",
  MANUAL: "Manual",
};

export default async function PagamentosPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: 100,
    include: { invoice: { include: { client: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pagamentos" subtitle="Histórico de recebimentos confirmados." />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Referente a</th>
              <th className="pb-3 pr-4 font-medium">Método</th>
              <th className="pb-3 pr-4 font-medium">Data</th>
              <th className="pb-3 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {payments.map((p) => (
              <tr key={p.id} className="text-slate-300">
                <td className="py-3.5 pr-4 font-medium text-white">{p.invoice.client.name}</td>
                <td className="py-3.5 pr-4">{p.invoice.description}</td>
                <td className="py-3.5 pr-4">{methodLabel[p.method]}</td>
                <td className="py-3.5 pr-4">{formatDate(p.paidAt)}</td>
                <td className="py-3.5 text-right font-semibold text-positive">{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
