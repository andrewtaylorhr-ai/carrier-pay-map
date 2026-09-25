"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RecruiterHireRow } from "@/lib/activity/hirePerformance";

const BAR_COLOR = "#22c55e";

// Capped so the chart stays readable — this list is already sorted by
// volume (see recruiterHireRanked), so a cap here just means "the top
// producers", not an arbitrary truncation.
const MAX_BARS = 12;

export function RecruiterHireChart({ rows }: { rows: RecruiterHireRow[] }) {
  const chartData = rows.slice(0, MAX_BARS).map((r) => ({
    recruiter: r.recruiter,
    total: r.total,
  }));

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        Hires by recruiter{rows.length > MAX_BARS ? ` (top ${MAX_BARS} by volume)` : ""}
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
              formatter={(value) => [String(value), "Hires"]}
            />
            <Bar dataKey="total" name="Hires" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
