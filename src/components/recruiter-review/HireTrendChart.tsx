"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyHireRow } from "@/lib/activity/hirePerformance";

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function HireTrendChart({ rows }: { rows: MonthlyHireRow[] }) {
  const chartData = rows.map((r) => ({ ...r, label: formatMonth(r.month) }));

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        Hires over time
      </div>
      {chartData.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center flex-1 flex items-center justify-center">
          No dated records in this window.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cpm-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 11 }}
              axisLine={{ stroke: "var(--cpm-border-strong)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#20242c",
                border: "1px solid var(--cpm-border-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--cpm-text)", fontWeight: 600 }}
              itemStyle={{ color: "var(--cpm-text-dim)" }}
              formatter={(value) => [String(value), "Hires"]}
            />
            <Area type="monotone" dataKey="total" name="Hires" stroke="#22c55e" fill="#22c55e" fillOpacity={0.45} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
