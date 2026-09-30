"use client";

import { useCarrierMap } from "@/lib/carrier-map-context";

function currentAndNextMonth(): string[] {
  const now = new Date();
  return [0, 1].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  });
}

// Target-vs-actual table for the currently selected recruiter. The app has
// no monthly actuals data source yet (only a single ongoing monthly target
// per recruiter, from RecruiterStrategyPlan) — Target columns are real,
// pulled straight from recruiterPlans; Actual columns are honestly shown as
// "—" with a note, rather than fabricated. Only the current + next month
// are shown (rather than the last 6) since there's no historical data to
// back-fill past rows with, but the upcoming month's target is still known.
export function MonthlyTargetActualTable() {
  const { strategyMode, recruiterFilter, getRecruiterPlan } = useCarrierMap();
  if (!strategyMode || !recruiterFilter) return null;

  const plan = getRecruiterPlan(recruiterFilter);
  const months = currentAndNextMonth();
  const targetSub = plan.targetSubmissions ?? "—";
  const targetHires = plan.targetHires ?? "—";

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 mt-3">
      <div className="flex items-baseline justify-between gap-2 mb-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Monthly target vs. actual — {recruiterFilter}
        </div>
        <div className="text-[11px] text-[var(--cpm-text-faint)]">Actuals not tracked yet</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">Month</th>
              <th className="py-1.5 pr-3 font-semibold">Submissions (Target / Actual)</th>
              <th className="py-1.5 pr-3 font-semibold">Hires (Target / Actual)</th>
              <th className="py-1.5 pr-3 font-semibold">Hire rate (Actual)</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                <td className="py-1.5 pr-3 text-[var(--cpm-text)]">{m}</td>
                <td className="py-1.5 pr-3">
                  {targetSub} / <span className="text-[var(--cpm-text-faint)]">—</span>
                </td>
                <td className="py-1.5 pr-3">
                  {targetHires} / <span className="text-[var(--cpm-text-faint)]">—</span>
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
