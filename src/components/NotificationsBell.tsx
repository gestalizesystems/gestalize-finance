"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, RefreshCw, FileText, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/lib/notifications";

const META: Record<NotificationType, { Icon: typeof Bell; cls: string }> = {
  payment: { Icon: CheckCircle2, cls: "bg-positive/15 text-positive" },
  subscription: { Icon: RefreshCw, cls: "bg-brand/15 text-brand-400" },
  invoice: { Icon: FileText, cls: "bg-brand/15 text-brand-400" },
  overdue: { Icon: AlertTriangle, cls: "bg-negative/15 text-negative" },
};

function timeAgo(value: Date | string): string {
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `há ${days}d`;
  return d.toLocaleDateString("pt-BR");
}

export function NotificationsBell({
  items,
  count,
}: {
  items: NotificationItem[];
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Corrige o dropdown se ele ultrapassar as bordas da tela
  useEffect(() => {
    if (!open || !dropRef.current) return;
    const el = dropRef.current;
    el.style.transform = "";
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.left < 8) {
      el.style.transform = `translateX(${8 - rect.left}px)`;
    } else if (rect.right > vw - 8) {
      el.style.transform = `translateX(${vw - 8 - rect.right}px)`;
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificações"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-slate-300 transition-colors hover:bg-ink-800"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div ref={dropRef} className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notificações</span>
            {count > 0 && <span className="text-xs text-slate-400">{count} em aberto</span>}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                Nenhuma atividade recente.
              </p>
            ) : (
              items.map((it) => {
                const { Icon, cls } = META[it.type];
                return (
                  <div
                    key={it.id}
                    className="flex items-start gap-3 border-b border-ink-700/40 px-4 py-3 last:border-0"
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{it.title}</p>
                      <p className="truncate text-xs text-slate-400">
                        {it.client} · {formatCurrency(it.amount)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">{timeAgo(it.at)}</span>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href="/cobrancas"
            onClick={() => setOpen(false)}
            className="block border-t border-ink-700/60 px-4 py-2.5 text-center text-xs font-medium text-brand-400 transition-colors hover:bg-ink-800"
          >
            Ver todas as cobranças
          </Link>
        </div>
      )}
    </div>
  );
}
