import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvoiceStatus, ClientStatus } from "@prisma/client";

export function StatCard({
  title,
  value,
  icon,
  accent = "brand",
  variation,
  children,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?: "brand" | "positive" | "negative";
  variation?: { pct: number; up: boolean };
  children?: React.ReactNode;
}) {
  const accentBg = {
    brand: "bg-brand/15 text-brand-400",
    positive: "bg-positive/15 text-positive",
    negative: "bg-negative/15 text-negative",
  }[accent];

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", accentBg)}>
          {icon}
        </div>
      </div>
      {variation && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-semibold",
              variation.up ? "text-positive" : "text-negative",
            )}
          >
            {variation.up ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
            {variation.pct.toFixed(1)}%
          </span>
          <span className="text-slate-500">vs mês anterior</span>
        </div>
      )}
      {children}
    </div>
  );
}

const invoiceStatusMap: Record<InvoiceStatus, { label: string; cls: string }> = {
  PAID: { label: "Pago", cls: "badge-paid" },
  PENDING: { label: "Pendente", cls: "badge-pending" },
  OVERDUE: { label: "Atrasado", cls: "badge-overdue" },
  CANCELED: { label: "Cancelado", cls: "bg-slate-500/15 text-slate-400" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const s = invoiceStatusMap[status];
  return <span className={cn("badge", s.cls)}>{s.label}</span>;
}

const clientStatusMap: Record<ClientStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "Ativo", cls: "badge-paid" },
  INACTIVE: { label: "Inativo", cls: "bg-slate-500/15 text-slate-400" },
  DELINQUENT: { label: "Inadimplente", cls: "badge-overdue" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const s = clientStatusMap[status];
  return <span className={cn("badge", s.cls)}>{s.label}</span>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
