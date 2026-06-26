import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos / Serviços"
        subtitle="Sistemas, bots e serviços que você vende."
      />

      <form action={createProduct} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
        <input name="name" required placeholder="Nome do sistema/serviço" className="input md:col-span-2" />
        <input name="description" placeholder="Descrição" className="input md:col-span-2" />
        <input name="defaultPrice" type="number" step="0.01" required placeholder="Preço (R$)" className="input" />
        <select name="type" className="input">
          <option value="RECURRING">Mensalidade</option>
          <option value="ONE_TIME">Avulso</option>
        </select>
        <button className="btn-primary md:col-span-6 md:justify-self-start">+ Adicionar produto</button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-white">{p.name}</h3>
              <span className={`badge ${p.type === "RECURRING" ? "badge-paid" : "bg-brand/15 text-brand-400"}`}>
                {p.type === "RECURRING" ? "Recorrente" : "Avulso"}
              </span>
            </div>
            {p.description && <p className="mt-1 text-sm text-slate-400">{p.description}</p>}
            <p className="mt-3 text-2xl font-bold text-white">{formatCurrency(p.defaultPrice)}</p>
            <p className="text-xs text-slate-500">{p._count.subscriptions} assinatura(s) ativa(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
}
