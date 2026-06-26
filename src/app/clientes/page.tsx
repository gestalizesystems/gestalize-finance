import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PageHeader, ClientStatusBadge } from "@/components/ui";
import { createClient } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subscriptions: true, invoices: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Gerencie os clientes da Gestalize Systems." />

      <form action={createClient} className="card grid grid-cols-1 gap-3 md:grid-cols-5">
        <input name="name" required placeholder="Nome / Razão social" className="input md:col-span-2" />
        <input name="email" type="email" placeholder="E-mail" className="input" />
        <input name="phone" placeholder="WhatsApp (+55...)" className="input" />
        <input name="document" placeholder="CPF / CNPJ" className="input" />
        <button className="btn-primary md:col-span-5 md:justify-self-start">+ Adicionar cliente</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-medium">Cliente</th>
              <th className="pb-3 pr-4 font-medium">Contato</th>
              <th className="pb-3 pr-4 font-medium">Assinaturas</th>
              <th className="pb-3 pr-4 font-medium">Cliente desde</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {clients.map((c) => (
              <tr key={c.id} className="text-slate-300">
                <td className="py-3.5 pr-4">
                  <p className="font-medium text-white">{c.name}</p>
                  {c.document && <p className="text-xs text-slate-500">{c.document}</p>}
                </td>
                <td className="py-3.5 pr-4">
                  <p>{c.email ?? "—"}</p>
                  <p className="text-xs text-slate-500">{c.phone ?? ""}</p>
                </td>
                <td className="py-3.5 pr-4">{c._count.subscriptions}</td>
                <td className="py-3.5 pr-4">{formatDate(c.createdAt)}</td>
                <td className="py-3.5">
                  <ClientStatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Nenhum cliente ainda. Adicione o primeiro acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
