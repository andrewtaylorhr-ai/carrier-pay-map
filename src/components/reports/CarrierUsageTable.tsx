"use client";

import { ALL_STATES, CARRIERS, CARRIER_ORDER } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";

// Real per-carrier footprint: how many states currently have this carrier
// assigned (from the map), and which recruiters have tagged this carrier as
// one they work (Strategy Plan's "carriers" tag list). Submissions/Hires/Hire
// rate stay "—" — not tracked per-carrier anywhere in the data model.
export function CarrierUsageTable() {
  const { assignments, recruiters, getRecruiterPlan, recruiterColor } = useCarrierMap();

  const rows = CARRIER_ORDER.map((id) => {
    const statesAssigned = ALL_STATES.filter((s) => assignments[s] === id).length;
    const repsForCarrier = recruiters.filter((r) => getRecruiterPlan(r).carriers.includes(id));
    return { id, label: CARRIERS[id].label, color: CARRIERS[id].color, statesAssigned, reps: repsForCarrier };
  }).sort((a, b) => b.statesAssigned - a.statesAssigned);

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2">
        Carrier usage
      </div>
      <div className="overflow-y-auto max-h-[320px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 bg-[var(--cpm-panel)]">
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">Carrier</th>
              <th className="py-1.5 pr-3 font-semibold">States assigned</th>
              <th className="py-1.5 pr-3 font-semibold">Recruiters working it</th>
              <th className="py-1.5 pr-3 font-semibold">Submissions</th>
              <th className="py-1.5 pr-3 font-semibold">Hires</th>
              <th className="py-1.5 pr-3 font-semibold">Hire rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                <td className="py-1.5 pr-3">
                  <span className="inline-flex items-center gap-2 text-[var(--cpm-text)] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10" style={{ background: row.color }} />
                    {row.label}
                  </span>
                </td>
                <td className="py-1.5 pr-3 tabular-nums">{row.statesAssigned}</td>
                <td className="py-1.5 pr-3">
                  {row.reps.length === 0 ? (
                    <span className="text-[var(--cpm-text-faint)]">none tagged</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {row.reps.map((r) => (
                        <span
                          key={r}
                          className="assignBadge"
                          style={{ background: recruiterColor(r) }}
                        >
                          {r}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10.5px] text-[var(--cpm-text-faint)] mt-2">
        Submissions/hires aren&apos;t tracked per-carrier yet — only per-recruiter-per-month (see stats above).
      </div>
    </div>
  );
}
