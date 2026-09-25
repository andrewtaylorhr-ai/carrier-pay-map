"use client";

import type { CarrierHireRow, MonthlyOutcomeRow, RecruiterHireRow } from "@/lib/activity/hirePerformance";
import { formatMonth } from "./HireTrendChart";

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

interface Totals {
  total: number;
  confirmed: number;
  pending: number;
  reversed: number;
}

// Plain-text readout of the same numbers already on the page — for "what
// should I actually take away from this" at a glance, without reading every
// chart and table first.
export function ManagerInsights({
  rows,
  carrierRows,
  trendRows,
  totals,
}: {
  rows: RecruiterHireRow[];
  carrierRows: CarrierHireRow[];
  trendRows: MonthlyOutcomeRow[];
  totals: Totals;
}) {
  const topRecruiter = [...rows].sort((a, b) => b.total - a.total)[0];
  const topCarrier = carrierRows[0];
  const peakMonth =
    trendRows.length > 0
      ? [...trendRows].sort(
          (a, b) => b.confirmed + b.pending + b.reversed - (a.confirmed + a.pending + a.reversed)
        )[0]
      : null;
  const needsFollowUp = totals.pending + totals.reversed;

  const bullets: string[] = [];
  if (topRecruiter) bullets.push(`${topRecruiter.recruiter} has the highest recorded volume (${topRecruiter.total}).`);
  if (topCarrier) bullets.push(`${topCarrier.carrier} accounts for ${topCarrier.total} hires in this window.`);
  if (peakMonth) {
    const peakTotal = peakMonth.confirmed + peakMonth.pending + peakMonth.reversed;
    bullets.push(`Peak month in this window: ${formatMonth(peakMonth.month)} (${peakTotal}).`);
  }
  bullets.push(
    `${needsFollowUp} hire${needsFollowUp === 1 ? "" : "s"} need${needsFollowUp === 1 ? "s" : ""} a follow-up call.`
  );
  bullets.push(`${pct(totals.confirmed, totals.total)} of hires are confirmed.`);

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
