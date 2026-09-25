"use client";

import type { RecruiterCarrierMatrix } from "@/lib/activity/hirePerformance";

// Recruiter x carrier grid — answers "which recruiter placed with which
// carrier" directly as a cross-tab, instead of requiring a click into each
// recruiter's card. Carriers are columns (ranked by volume, same order as
// the carrier donut/chart), recruiters are rows (ranked by volume, same
// order as everywhere else on this page).
export function RecruiterCarrierTable({ matrix }: { matrix: RecruiterCarrierMatrix }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Recruiter x carrier
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        How many of each recruiter&apos;s hires landed with each carrier. Scroll right for more.
      </div>
      {matrix.rows.length === 0 || matrix.carriers.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center">No data in this window.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-[12px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[var(--cpm-panel)] text-left py-1.5 pr-3 font-semibold uppercase tracking-wide text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap">
                  Recruiter
                </th>
                {matrix.carriers.map((c) => (
                  <th
                    key={c}
                    className="py-1.5 px-2 font-semibold text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap text-right"
                  >
                    {c}
                  </th>
                ))}
                <th className="py-1.5 pl-2 font-semibold text-[11px] text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)] whitespace-nowrap text-right">
                  Total
                </th>
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
                      key={matrix.carriers[i]}
                      className={`py-1.5 px-2 text-right whitespace-nowrap ${
                        c > 0 ? "text-[var(--cpm-text)] font-semibold" : "text-[var(--cpm-text-faint)]"
                      }`}
                    >
                      {c > 0 ? c : "–"}
                    </td>
                  ))}
                  <td className="py-1.5 pl-2 text-right whitespace-nowrap font-bold text-[var(--cpm-text)]">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
