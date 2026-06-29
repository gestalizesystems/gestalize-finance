import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { ProductsGrid, type ProductItem } from "@/components/ProductsGrid";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  const items: ProductItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    defaultPrice: toNumber(p.defaultPrice),
    implementationPrice: p.implementationPrice ? toNumber(p.implementationPrice) : null,
    type: p.type,
    active: p.active,
    subscriptions: p._count.subscriptions,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos / Serviços"
        subtitle="Sistemas, bots e serviços que você vende. Clique em um card para ver detalhes."
      />

      <form action={createProduct} className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input name="name" required placeholder="Nome do sistema/serviço" className="input" />
          <input name="description" placeholder="Descrição" className="input" />
          <input name="defaultPrice" type="number" step="0.01" required placeholder="Mensalidade (R$)" className="input" />
          <input name="implementationPrice" type="number" step="0.01" placeholder="Implantação (R$)" className="input" />
          <select name="type" className="input">
            <option value="RECURRING">Mensalidade</option>
            <option value="ONE_TIME">Avulso</option>
          </select>
        </div>
        <button className="btn-primary">+ Adicionar produto</button>
      </form>

      <ProductsGrid products={items} />
    </div>
  );
}
