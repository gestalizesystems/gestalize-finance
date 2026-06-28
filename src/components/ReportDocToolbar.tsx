"use client";

import { useEffect } from "react";
import { Printer, ArrowLeft } from "lucide-react";

export function ReportDocToolbar({ backHref }: { backHref: string }) {
  // Abre o diálogo de impressão automaticamente ao carregar.
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
      <a href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </a>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
      </button>
    </div>
  );
}
