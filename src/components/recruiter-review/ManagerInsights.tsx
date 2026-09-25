"use client";

import type { CarrierHireRow, MonthlyHireRow, RecruiterHireRow } from "@/lib/activity/hirePerformance";
import { formatMonth } from "./HireTrendChart";

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

// Plain-text readout of the same numbers already on the page — for "what
// should I actually take away from this" at a glance, without reading every
// chart and table first.
export function ManagerInsights({
  rows,
  carrierRows,
  trendRows,
  total,
}: {
  rows: RecruiterHireRow[];
  carrierRows: CarrierHireRow[];
  trendRows: MonthlyHireRow[];
  total: number;
}) {
  const topRecruiter = rows[0];
  const topCarrier = carrierRows[0];
  const peakMonth = trendRows.length > 0 ? [...trendRows].sort((a, b) => b.total - a.total)[0] : null;

  const bullets: string[] = [];
  if (topRecruiter) bullets.push(`${topRecruiter.recruiter} has the highest recorded volume (${topRecruiter.total}).`);
  if (topCarrier) bullets.push(`${topCarrier.carrier} accounts for ${topCarrier.total} hires in this window (${pct(topCarrier.total, total)}).`);
  if (peakMonth) bullets.push(`Peak month in this window: ${formatMonth(peakMonth.month)} (${peakMonth.total}).`);
  if (rows.length > 0) {
    const avgPerRecruiter = Math.round(total / rows.length);
    bullets.push(`${total} hires across ${rows.length} recruiter${rows.length === 1 ? "" : "s"} — averaging ${avgPerRecruiter} per recruiter.`);
  }

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        Manager insights
      </div>
      {bullets.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center flex-1 flex items-center justify-center">
          No data yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {bullets.map((b, i) => (
            <li key={i} className="text-[12.5px] text-[var(--cpm-text-dim)] flex gap-2">
              <span className="text-[var(--cpm-accent)] shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
