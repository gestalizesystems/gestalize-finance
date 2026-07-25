import { prisma } from "@/lib/prisma";
import { getMonthsWithData } from "@/lib/metrics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { MonthFilter } from "@/components/MonthFilter";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const methodLabel: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CARD: "Cartão",
  MANUAL: "Manual",
};

// Constrói o intervalo [start, end) de um mês "YYYY-MM".
function monthRange(month?: string) {
  if (!month) return null;
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return null;
  return { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
}

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: { page?: string; month?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const month = searchParams.month;
  const range = monthRange(month);

  const where = range ? { paidAt: range } : {};

  const [total, payments, monthsWithData] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { invoice: { include: { client: true } } },
    }),
    getMonthsWithData(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefForPage = (p: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    params.set("page", String(p));
    return `/pagamentos?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos"
        subtitle="Histórico de recebimentos confirmados."
        action={<MonthFilter months={monthsWithData} />}
      />

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
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Nenhum pagamento neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          hrefForPage={hrefForPage}
        />
      </div>
    </div>
  );
}
