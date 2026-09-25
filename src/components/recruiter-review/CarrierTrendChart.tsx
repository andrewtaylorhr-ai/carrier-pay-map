"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyCarrierTrend } from "@/lib/activity/hirePerformance";
import { CHART_OTHERS_COLOR, colorForIndex } from "@/lib/activity/dashboardStats";
import { formatMonth } from "./HireTrendChart";

// Same window/month-bucketing as HireTrendChart's summed line, split out
// per carrier — answers "which carrier were those hires for" month by
// month, rather than just the combined total.
export function CarrierTrendChart({ trend }: { trend: MonthlyCarrierTrend }) {
  const chartData = trend.months.map((m, i) => {
    const point: Record<string, string | number> = { month: m, label: formatMonth(m) };
    trend.series.forEach((s) => {
      point[s.carrier] = s.counts[i];
    });
    return point;
  });

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Hires over time, by carrier
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Same window as the trend chart above, one line per carrier.
      </div>
      {chartData.length === 0 || trend.series.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center flex-1 flex items-center justify-center">
          No dated records in this window.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: -12, bottom: 0 }}>
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
              formatter={(value, name) => [String(value), String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--cpm-text-dim)" }} />
            {trend.series.map((s, i) => (
              <Line
                key={s.carrier}
                type="monotone"
                dataKey={s.carrier}
                name={s.carrier}
                stroke={s.carrier === "Other" ? CHART_OTHERS_COLOR : colorForIndex(i)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
