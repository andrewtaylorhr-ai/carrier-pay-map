"use client";

import { useCarrierMap } from "@/lib/carrier-map-context";
import { currentAndNextMonth } from "@/lib/recruiters";

// Target-vs-actual table for the currently selected recruiter. Target
// columns are real, pulled straight from recruiterPlans (a recruiter's
// single ongoing monthly target). Actual columns are real too, once
// entered — small editable number inputs backed by recruiterActuals,
// keyed per calendar month (see monthKey() in lib/recruiters) so this
// month's and next month's numbers don't overwrite each other, and so the
// full team's numbers roll up cleanly on the /reports page. Only the
// current + next month are shown (rather than the last 6) since there's
// no historical actuals to back-fill past rows with.
export function MonthlyTargetActualTable() {
  const { strategyMode, recruiterFilter, getRecruiterPlan, getRecruiterActual, updateRecruiterActual } =
    useCarrierMap();
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
        <div className="text-[11px] text-[var(--cpm-text-faint)]">Enter actuals as they come in</div>
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
            {months.map(({ key, label }) => {
              const actual = getRecruiterActual(recruiterFilter, key);
              const hireRate =
                actual.submissions && actual.submissions > 0 && actual.hires != null
                  ? `${Math.round((actual.hires / actual.submissions) * 100)}%`
                  : "—";
              return (
                <tr key={key} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                  <td className="py-1.5 pr-3 text-[var(--cpm-text)]">{label}</td>
                  <td className="py-1.5 pr-3">
                    <span className="tabular-nums">{targetSub}</span> /{" "}
                    <input
                      type="number"
                      min={0}
                      value={actual.submissions ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateRecruiterActual(recruiterFilter, key, {
                          submissions: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-14 bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <span className="tabular-nums">{targetHires}</span> /{" "}
                    <input
                      type="number"
                      min={0}
                      value={actual.hires ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateRecruiterActual(recruiterFilter, key, {
                          hires: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-14 bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
                    />
                  </td>
                  <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">{hireRate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
