import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { displayPhone, displayDocument } from "@/lib/masks";
import { PageHeader, ClientStatusBadge } from "@/components/ui";
import { SearchInput } from "@/components/SearchInput";
import { MaskedInput } from "@/components/MaskedInput";
import { Pagination } from "@/components/Pagination";
import { createClient } from "../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { document: { contains: q } },
        ],
      }
    : {};

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { subscriptions: true, invoices: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefForPage = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/clientes?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Clique em um cliente para ver o resumo financeiro dele." />

      <form action={createClient} className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input name="name" required placeholder="Nome / Razão social" className="input" />
          <input name="email" type="email" placeholder="E-mail" className="input" />
          <MaskedInput name="phone" mask="phone" placeholder="(11) 99999-9999" />
          <MaskedInput name="document" mask="cpfcnpj" placeholder="CPF / CNPJ" />
        </div>
        <button className="btn-primary">+ Adicionar cliente</button>
      </form>

      <SearchInput placeholder="Pesquisar por nome, CPF ou CNPJ..." />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Contato</th>
              <th className="pb-3 pr-4 font-medium">Assinaturas</th>
              <th className="pb-3 pr-4 font-medium">Cliente desde</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {clients.map((c) => (
              <tr key={c.id} className="group cursor-pointer text-slate-300 transition-colors hover:bg-ink-800/60">
                <td className="py-3.5 pr-4">
                  <Link href={`/clientes/${c.id}`} className="block">
                    <p className="font-medium text-white group-hover:text-brand-400">{c.name}</p>
                    {c.document && (
                      <p className="text-xs text-slate-500">{displayDocument(c.document)}</p>
                    )}
                  </Link>
                </td>
                <td className="py-3.5 pr-4">
                  <p>{c.email ?? "—"}</p>
                  <p className="text-xs text-slate-500">{displayPhone(c.phone)}</p>
                </td>
                <td className="py-3.5 pr-4">{c._count.subscriptions}</td>
                <td className="py-3.5 pr-4">{formatDate(c.createdAt)}</td>
                <td className="py-3.5 pr-4">
                  <ClientStatusBadge status={c.status} />
                </td>
                <td className="py-3.5 text-right">
                  <Link href={`/clientes/${c.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:underline">
                    Ver resumo <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {q ? "Nenhum cliente encontrado para a busca." : "Nenhum cliente ainda. Adicione o primeiro acima."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} totalItems={total} hrefForPage={hrefForPage} />
      </div>
    </div>
  );
}
