import { prisma } from "@/lib/prisma";
import { getMonthsWithData } from "@/lib/metrics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { MonthFilter } from "@/components/MonthFilter";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const typeLabel: Record<string, string> = {
  IMPLEMENTATION: "Implantação",
  SUBSCRIPTION: "Mensalidade",
  EXTRA: "Avulso",
};

function monthRange(month?: string) {
  if (!month) return null;
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return null;
  return { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
}

export default async function ReceitasPage({
  searchParams,
}: {
  searchParams: { page?: string; month?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const month = searchParams.month;
  const range = monthRange(month);

  const where = { status: "PAID" as const, ...(range ? { paidAt: range } : {}) };

  const [total, invoices, monthsWithData] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { client: true },
    }),
    getMonthsWithData(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefForPage = (p: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    params.set("page", String(p));
    return `/receitas?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receitas"
        subtitle="Entradas confirmadas: implantação, mensalidades e avulsos."
        action={<MonthFilter months={monthsWithData} />}
      />

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
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">Nenhuma receita neste período.</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} totalItems={total} hrefForPage={hrefForPage} />
      </div>
    </div>
  );
}
