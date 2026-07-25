"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

// Esconde toda a navegação em telas "cheias" (ex: login, documento de impressão).
const FULLSCREEN_ROUTES = ["/login", "/relatorios/documento"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  // Fecha o drawer ao trocar de rota.
  useEffect(() => setOpen(false), [pathname]);

  // Trava o scroll do body quando o drawer está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (isFullscreen) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      {/* Sidebar fixa (desktop) */}
      <Sidebar className="hidden lg:flex" />

      {/* Drawer (mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Coluna de conteúdo */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-3 border-b border-ink-700/60 bg-ink-900 px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-slate-200 active:bg-ink-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
