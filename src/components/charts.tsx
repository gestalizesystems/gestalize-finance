"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type MonthDatum = { label: string; receita: number; despesa: number };

const tooltipStyle = {
  background: "#0b1020",
  border: "1px solid #1c2747",
  borderRadius: 12,
  color: "#e5e9f5",
  fontSize: 12,
};

export function RevenueExpenseChart({ data }: { data: MonthDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid vertical={false} stroke="#1c2747" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          width={34}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "#13203855" }}
          formatter={(value) => formatCurrency(value)}
        />
        <Bar dataKey="receita" name="Receitas" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="despesa" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({
  paid,
  pending,
  overdue,
}: {
  paid: number;
  pending: number;
  overdue: number;
}) {
  const data = [
    { name: "Pagas", value: paid, color: "#2563eb" },
    { name: "Pendentes", value: pending, color: "#f59e0b" },
    { name: "Atrasadas", value: overdue, color: "#ef4444" },
  ];
  const total = paid + pending + overdue;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-slate-400">Total</span>
        <span className="text-2xl font-bold text-white">{total}</span>
      </div>
    </div>
  );
}

export function MrrTrendChart({ data }: { data: MonthDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="#1c2747" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          width={34}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
        <Line
          type="monotone"
          dataKey="receita"
          name="Receita"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#3b82f6" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Lucro por mês: barras de receita/despesa + linha de lucro.
export function ProfitChart({
  data,
}: {
  data: { label: string; receita: number; despesa: number; lucro: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} barGap={6}>
        <CartesianGrid vertical={false} stroke="#1c2747" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          width={34}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#13203855" }} formatter={(value) => formatCurrency(value)} />
        <Bar dataKey="receita" name="Receita" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: "#22c55e" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Receita por tipo (implantação / mensalidade / avulso).
export function RevenueTypeDonut({
  implementation,
  subscription,
  extra,
}: {
  implementation: number;
  subscription: number;
  extra: number;
}) {
  const data = [
    { name: "Mensalidades", value: subscription, color: "#2563eb" },
    { name: "Implantação", value: implementation, color: "#22c55e" },
    { name: "Avulsos", value: extra, color: "#f59e0b" },
  ];
  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={56} outerRadius={88} paddingAngle={2} stroke="none">
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
