"use client";

import type { DailyHireMatrix } from "@/lib/activity/hirePerformance";

function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Recruiter x day grid — only columns for days that actually had at least
// one hire (see dailyHiresByRecruiter), otherwise a 6-month calendar would
// be almost entirely empty cells. Horizontally scrollable since the number
// of day-columns isn't bounded the way month-columns are.
export function DailyHiresTable({ matrix }: { matrix: DailyHireMatrix }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Daily hires by recruiter
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Only days with at least one recorded hire are shown. Scroll right for more.
      </div>
      {matrix.rows.length === 0 || matrix.days.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center">No dated records in this window.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-[12px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[var(--cpm-panel)] text-left py-1.5 pr-3 font-semibold uppercase tracking-wide text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap">
                  Recruiter
                </th>
                {matrix.days.map((d) => (
                  <th
                    key={d}
                    className="py-1.5 px-2 font-semibold text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap text-right"
                  >
                    {formatDay(d)}
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
                      key={matrix.days[i]}
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
