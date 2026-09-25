"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartSlice } from "@/lib/activity/dashboardStats";

export function CarrierDonut({
  slices,
  total,
  title = "Carrier performance",
}: {
  slices: ChartSlice[];
  total: number;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        {title}
      </div>
      {slices.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center">No data.</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative w-[150px] h-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#20242c",
                    border: "1px solid var(--cpm-border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--cpm-text)" }}
                  itemStyle={{ color: "var(--cpm-text-dim)" }}
                  formatter={(value, name) => [String(value), String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[18px] font-bold text-[var(--cpm-text)]">{total}</div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--cpm-text-faint)]">total</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            {slices.map((s) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.name} className="flex items-center gap-2 text-[12px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[var(--cpm-text)] font-medium truncate">{s.name}</span>
                  <span className="text-[var(--cpm-text-faint)] ml-auto shrink-0">
                    {s.value} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
