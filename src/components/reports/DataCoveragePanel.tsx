"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ALL_STATES } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";

// Honest substitute for the mockup's "Recent Activity / Data Quality" panel:
// this app has no activity log, but it does have real, computable coverage
// gaps across the whole roster (not team-filtered, so it reads as a global
// health check regardless of which team is selected elsewhere on the page).
export function DataCoveragePanel() {
  const { assignments, recruiters, recruiterAssignments, getRecruiterPlan } = useCarrierMap();

  const unassignedStates = ALL_STATES.filter((s) => !assignments[s]).length;
  const statesNoRecruiter = ALL_STATES.filter((s) => !(recruiterAssignments[s] || []).length).length;
  const recruitersNoTarget = recruiters.filter((r) => {
    const p = getRecruiterPlan(r);
    return p.targetSubmissions == null && p.targetHires == null;
  }).length;
  const recruitersNoCarriers = recruiters.filter((r) => getRecruiterPlan(r).carriers.length === 0).length;
  const recruitersNoStates = recruiters.filter(
    (r) => !Object.values(recruiterAssignments).some((list) => list.includes(r))
  ).length;

  const items = [
    { label: "States with no carrier assigned", count: unassignedStates },
    { label: "States with no recruiter assigned", count: statesNoRecruiter },
    { label: "Recruiters with no target set", count: recruitersNoTarget },
    { label: "Recruiters with no carriers tagged", count: recruitersNoCarriers },
    { label: "Recruiters with no states assigned", count: recruitersNoStates },
  ];
  const totalGaps = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-2">
        {totalGaps > 0 ? (
          <AlertTriangle size={14} className="text-[var(--cpm-accent)]" />
        ) : (
          <CheckCircle2 size={14} className="text-[var(--cpm-green)]" />
        )}
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Data coverage
        </div>
      </div>
      {recruiters.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-2">No recruiters added yet.</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 text-[12.5px]">
              <span className="text-[var(--cpm-text-dim)]">{item.label}</span>
              <span
                className={`tabular-nums font-semibold ${
                  item.count > 0 ? "text-[var(--cpm-accent)]" : "text-[var(--cpm-green)]"
                }`}
              >
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
