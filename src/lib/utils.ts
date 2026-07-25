import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Aceita number, string ou Prisma.Decimal (que tem toString()).
export function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toNumber(value));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatMonthYear(date: Date): string {
  const s = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Retorna sinal e % de variação entre dois valores.
export function variation(current: number, previous: number) {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, up: current >= 0 };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { pct: Math.abs(pct), up: pct >= 0 };
}
