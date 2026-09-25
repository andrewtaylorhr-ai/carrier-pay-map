"use client";

import type { MonthlyHireMatrix } from "@/lib/activity/hirePerformance";
import { formatMonth } from "./HireTrendChart";

// Recruiter x month grid — the same data behind "Hires over time" (a single
// summed line), broken out per recruiter into a table. Only months that
// actually had at least one hire are shown, matching the trend chart's
// window rather than padding with empty columns.
export function MonthlyHiresTable({ matrix }: { matrix: MonthlyHireMatrix }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Monthly hires by recruiter
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Same window as the trend chart above, broken out by recruiter.
      </div>
      {matrix.rows.length === 0 || matrix.months.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center">No dated records in this window.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-[12px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[var(--cpm-panel)] text-left py-1.5 pr-3 font-semibold uppercase tracking-wide text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap">
                  Recruiter
                </th>
                {matrix.months.map((m) => (
                  <th
                    key={m}
                    className="py-1.5 px-2 font-semibold text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap text-right"
                  >
                    {formatMonth(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.recruiter} className="border-b border-[var(--cpm-border)] last:border-0">
                  <td className="sticky left-0 bg-[var(--cpm-panel)] py-1.5 pr-3 font-medium text-[var(--cpm-text)] whitespace-nowrap">
                    {row.recruiter}
                  </td>
                  {row.counts.map((c, i) => (
                    <td
                      key={matrix.months[i]}
                      className={`py-1.5 px-2 text-right whitespace-nowrap ${
                        c > 0 ? "text-[var(--cpm-text)] font-semibold" : "text-[var(--cpm-text-faint)]"
                      }`}
                    >
                      {c > 0 ? c : "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
