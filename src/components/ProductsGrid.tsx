"use client";

import { useState } from "react";
import { X, Trash2, Power } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteProduct, toggleProductActive } from "@/app/actions";

export type ProductItem = {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number;
  implementationPrice: number | null;
  type: "ONE_TIME" | "RECURRING";
  active: boolean;
  subscriptions: number;
};

export function ProductsGrid({ products }: { products: ProductItem[] }) {
  const [selected, setSelected] = useState<ProductItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="card text-left transition-colors hover:border-brand/50 hover:bg-ink-800"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{p.name}</h3>
              <span
                className={`badge ${
                  p.active
                    ? p.type === "RECURRING"
                      ? "badge-paid"
                      : "bg-brand/15 text-brand-400"
                    : "bg-slate-500/15 text-slate-400"
                }`}
              >
                {!p.active ? "Inativo" : p.type === "RECURRING" ? "Recorrente" : "Avulso"}
              </span>
            </div>
            {p.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.description}</p>
            )}
            <p className="mt-3 text-2xl font-bold text-white">
              {formatCurrency(p.defaultPrice)}
              <span className="text-sm font-normal text-slate-500">/mês</span>
            </p>
            <p className="text-xs text-slate-500">{p.subscriptions} assinatura(s) ativa(s)</p>
          </button>
        ))}
      </div>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function ProductModal({
  product,
  onClose,
}: {
  product: ProductItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-700 bg-ink-850 p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{product.name}</h2>
            <span
              className={`badge mt-1 ${
                product.active
                  ? product.type === "RECURRING"
                    ? "badge-paid"
                    : "bg-brand/15 text-brand-400"
                  : "bg-slate-500/15 text-slate-400"
              }`}
            >
              {!product.active
                ? "Inativo"
                : product.type === "RECURRING"
                ? "Recorrente"
                : "Avulso"}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300">
          {product.description || "Sem descrição."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
            <p className="text-xs text-slate-500">Mensalidade</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatCurrency(product.defaultPrice)}
            </p>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
            <p className="text-xs text-slate-500">Implementação</p>
            <p className="mt-1 text-xl font-bold text-white">
              {product.implementationPrice
                ? formatCurrency(product.implementationPrice)
                : "—"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          {product.subscriptions} assinatura(s) ativa(s) vinculada(s).
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-ink-700 pt-4">
          <form action={toggleProductActive} onSubmit={onClose}>
            <input type="hidden" name="productId" value={product.id} />
            <button className="btn-ghost">
              <Power className="h-4 w-4" />
              {product.active ? "Inativar" : "Ativar"}
            </button>
          </form>
          <form action={deleteProduct} onSubmit={onClose}>
            <input type="hidden" name="productId" value={product.id} />
            <button className="inline-flex items-center gap-2 rounded-xl border border-negative/40 bg-negative/10 px-3.5 py-2 text-sm font-medium text-negative transition-colors hover:bg-negative/20">
              <Trash2 className="h-4 w-4" />
              {product.subscriptions > 0 ? "Inativar (tem assinaturas)" : "Excluir"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
