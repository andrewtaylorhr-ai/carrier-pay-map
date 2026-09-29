"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendRow = { month: string; submissions: number; hires: number };

// No real submissions/hires tracking data exists yet in this app (it's a
// pay-map + manual carrier/recruiter assignment tool) — this renders the
// same "no data" empty-state convention already established in the Carrier
// Activity dashboard (see SubmissionsChart.tsx) rather than fabricating
// numbers.
const TREND_DATA: TrendRow[] = [];

export function MonthlyTrendCard() {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-[2] min-w-[260px] flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Monthly trend
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--cpm-text-dim)]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--cpm-accent)] inline-block" />
            Submissions
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--cpm-green)] inline-block" />
            Hires
          </span>
        </div>
      </div>
      {TREND_DATA.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--cpm-text-faint)] py-6 text-center">
          No submissions/hires data tracked yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={TREND_DATA} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cpm-border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--cpm-text-dim)", fontSize: 10 }}
              axisLine={{ stroke: "var(--cpm-border-strong)" }}
              tickLine={false}
            />
            <YAxis tick={{ fill: "var(--cpm-text-dim)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              cursor={{ fill: "var(--cpm-panel-alt)" }}
              contentStyle={{ background: "#20242c", border: "1px solid var(--cpm-border-strong)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "var(--cpm-text)", fontWeight: 600 }}
            />
            <Bar dataKey="submissions" fill="var(--cpm-accent)" radius={[3, 3, 0, 0]} maxBarSize={14} />
            <Bar dataKey="hires" fill="var(--cpm-green)" radius={[3, 3, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
