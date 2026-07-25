"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  RefreshCw,
  CreditCard,
  ArrowDownToLine,
  TrendingDown,
  FileBarChart,
  Boxes,
  Workflow,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cobrancas", label: "Cobranças", icon: Receipt },
  { href: "/assinaturas", label: "Assinaturas", icon: RefreshCw },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/receitas", label: "Receitas", icon: ArrowDownToLine },
  { href: "/despesas", label: "Despesas", icon: TrendingDown },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/produtos", label: "Produtos/Serviços", icon: Boxes },
  { href: "/automacao", label: "Automação", icon: Workflow },
  { href: "/mensagens", label: "Mensagens", icon: MessageSquare },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900 px-4 py-5">
      {/* Logo */}
      <Logo className="mb-7 px-2" />

      {/* Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", active && "nav-item-active")}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé / usuário */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-700/60 bg-ink-850 px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-bold text-white">
          G
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-white">Gestalize Systems</p>
          <p className="text-xs text-slate-400">Administrador</p>
        </div>
        <a
          href="/api/logout"
          title="Sair"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-ink-800 hover:text-negative"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </a>
      </div>
    </aside>
  );
}
