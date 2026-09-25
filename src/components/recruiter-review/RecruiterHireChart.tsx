"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RecruiterHireRow } from "@/lib/activity/hirePerformance";

export const OUTCOME_COLOR = {
  confirmed: "#22c55e",
  pending: "#d4a137",
  reversed: "#e5484d",
  unclear: "#6b7280",
} as const;

// Capped so the chart stays readable — this list is already sorted
// worst-first (see recruiterHireRanked), so a cap here just means "the
// recruiters most worth looking at", not an arbitrary truncation.
const MAX_BARS = 12;

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

export function RecruiterHireChart({ rows }: { rows: RecruiterHireRow[] }) {
  const chartData = rows.slice(0, MAX_BARS).map((r) => ({
    recruiter: r.recruiter,
    confirmed: r.confirmed,
    pending: r.pending,
    reversed: r.reversed,
    unclear: r.unclear,
  }));

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Hires by recruiter{rows.length > MAX_BARS ? ` (top ${MAX_BARS} needing the most attention)` : ""}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--cpm-text-faint)]">
          <LegendDot color={OUTCOME_COLOR.confirmed} label="Confirmed" />
          <LegendDot color={OUTCOME_COLOR.pending} label="Pending" />
          <LegendDot color={OUTCOME_COLOR.reversed} label="Reversed" />
          <LegendDot color={OUTCOME_COLOR.unclear} label="Unclear" />
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center">No data.</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cpm-border)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 11 }}
              axisLine={{ stroke: "var(--cpm-border-strong)" }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="recruiter"
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              cursor={{ fill: "var(--cpm-panel-alt)" }}
              contentStyle={{
                background: "#20242c",
                border: "1px solid var(--cpm-border-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--cpm-text)", fontWeight: 600 }}
              itemStyle={{ color: "var(--cpm-text-dim)" }}
            />
            <Bar dataKey="confirmed" stackId="a" fill={OUTCOME_COLOR.confirmed} />
            <Bar dataKey="pending" stackId="a" fill={OUTCOME_COLOR.pending} />
            <Bar dataKey="reversed" stackId="a" fill={OUTCOME_COLOR.reversed} />
            <Bar dataKey="unclear" stackId="a" fill={OUTCOME_COLOR.unclear} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
