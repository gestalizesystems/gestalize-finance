"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
      <label className="min-w-0 flex-1 sm:flex-none">
        <span className="mb-1 block text-xs text-slate-400">Início</span>
        <input type="date" value={s} max={e} onChange={(ev) => setS(ev.target.value)} className="input py-2" />
      </label>
      <label className="min-w-0 flex-1 sm:flex-none">
        <span className="mb-1 block text-xs text-slate-400">Fim</span>
        <input type="date" value={e} min={s} onChange={(ev) => setE(ev.target.value)} className="input py-2" />
      </label>
      <button onClick={apply} className="btn-ghost w-full justify-center sm:w-auto">Aplicar</button>
    </div>
  );
}
