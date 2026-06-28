"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";

export function DateRangeFilter({ start, end }: { start: string; end: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [s, setS] = useState(start);
  const [e, setE] = useState(end);

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("start", s);
    params.set("end", e);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-slate-400">Início</label>
        <input type="date" value={s} max={e} onChange={(ev) => setS(ev.target.value)} className="input py-2" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Fim</label>
        <input type="date" value={e} min={s} onChange={(ev) => setE(ev.target.value)} className="input py-2" />
      </div>
      <button onClick={apply} className="btn-ghost">Aplicar</button>
    </div>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary" title="Imprimir relatório">
      <Printer className="h-4 w-4" />
      Imprimir
    </button>
  );
}
