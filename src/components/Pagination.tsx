import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Paginação baseada em URL. `hrefForPage` constrói o link de cada página
 * preservando os demais filtros (mês, busca, etc.).
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  hrefForPage: (p: number) => string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-xs text-slate-500">
        {totalItems} {totalItems === 1 ? "registro" : "registros"}
      </p>
    );
  }

  // Janela de páginas em torno da atual.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) pages.push(i);

  const baseBtn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-ink-700 px-2 text-sm transition-colors";

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Página {page} de {totalPages} · {totalItems} registros
      </p>
      <div className="flex items-center gap-1.5">
        <Link
          href={hrefForPage(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={cn(
            baseBtn,
            "bg-ink-850 text-slate-300 hover:bg-ink-800",
            page === 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {pages.map((p) => (
          <Link
            key={p}
            href={hrefForPage(p)}
            className={cn(
              baseBtn,
              p === page
                ? "bg-brand text-white"
                : "bg-ink-850 text-slate-300 hover:bg-ink-800",
            )}
          >
            {p}
          </Link>
        ))}
        <Link
          href={hrefForPage(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={cn(
            baseBtn,
            "bg-ink-850 text-slate-300 hover:bg-ink-800",
            page === totalPages && "pointer-events-none opacity-40",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
