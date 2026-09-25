"use client";

import type { RecruiterHireRow } from "@/lib/activity/hirePerformance";

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

// Volume-first ranking — deliberately different sort than the recruiter
// detail cards below (which rank worst-first by issue count). This answers
// "who's producing the most", that answers "who needs a call".
export function RecruiterPerformanceTable({ rows, total }: { rows: RecruiterHireRow[]; total: number }) {
  const byVolume = [...rows].sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Recruiter performance
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">Ranked by volume — highest producer first.</div>
      {byVolume.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center flex-1 flex items-center justify-center">
          No data.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)]">
                <th className="py-1.5 pr-2 font-semibold">Recruiter</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Hires</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Share</th>
                <th className="py-1.5 pl-2 font-semibold">Top carrier</th>
              </tr>
            </thead>
            <tbody>
              {byVolume.map((row) => (
                <tr key={row.recruiter} className="border-b border-[var(--cpm-border)] last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-[var(--cpm-text)] whitespace-nowrap">{row.recruiter}</td>
                  <td className="py-1.5 pr-2 text-right text-[var(--cpm-text-dim)]">{row.total}</td>
                  <td className="py-1.5 pr-2 text-right text-[var(--cpm-text-dim)]">{pct(row.total, total)}</td>
                  <td className="py-1.5 pl-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{row.topCarrier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
