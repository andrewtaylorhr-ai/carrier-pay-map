"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CarrierVolumeRow } from "@/lib/activity/dashboardStats";

type Metric = "submissions" | "hires" | "rate";

const METRIC_LABEL: Record<Metric, string> = {
  submissions: "Submissions",
  hires: "Hires",
  rate: "Hire Rate",
};

export function SubmissionsChart({ rows }: { rows: CarrierVolumeRow[] }) {
  const [metric, setMetric] = useState<Metric>("submissions");

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        carrier: r.carrier,
        submissions: r.counts.total,
        hires: r.counts.hired,
        rate: r.rate !== null ? Math.round(r.rate * 100) : 0,
        color: r.color,
      })),
    [rows]
  );

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Submissions by carrier
        </div>
        <div className="inline-flex items-center gap-0.5 bg-[var(--cpm-panel-alt)] p-1 rounded-full">
          {(["submissions", "hires", "rate"] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${
                metric === m ? "bg-[var(--cpm-accent)] text-[#241800]" : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
              }`}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center">No data.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cpm-border)" vertical={false} />
            <XAxis
              dataKey="carrier"
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 11 }}
              axisLine={{ stroke: "var(--cpm-border-strong)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v) => (metric === "rate" ? `${v}%` : `${v}`)}
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
              formatter={(value) => (metric === "rate" ? [`${value}%`, "Hire rate"] : [String(value), METRIC_LABEL[metric]])}
            />
            <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={44}>
              {chartData.map((d) => (
                <Cell key={d.carrier} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
