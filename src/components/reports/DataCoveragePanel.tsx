"use client";

import { AlertTriangle, Ban, MapPinOff, Target, Truck, UserX } from "lucide-react";
import { ALL_STATES } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";

// Honest substitute for the mockup's "Recent Activity / Data Quality" row of
// colored count chips: this app has no activity log, but it does have real,
// computable coverage gaps across the whole roster (not team-filtered, so it
// reads as a global health check regardless of which team is selected
// elsewhere on the page). Laid out as a horizontal chip row (icon + count +
// label) to match that section's visual treatment instead of a plain list.
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
    { label: "States, no carrier", count: unassignedStates, icon: Ban, color: "red" as const },
    { label: "States, no recruiter", count: statesNoRecruiter, icon: MapPinOff, color: "amber" as const },
    { label: "Recruiters, no target", count: recruitersNoTarget, icon: Target, color: "blue" as const },
    { label: "Recruiters, no carriers", count: recruitersNoCarriers, icon: Truck, color: "purple" as const },
    { label: "Recruiters, no states", count: recruitersNoStates, icon: UserX, color: "green" as const },
  ];
  const totalGaps = items.reduce((sum, i) => sum + i.count, 0);

  const COLOR_CLS: Record<string, string> = {
    red: "bg-[var(--cpm-red-soft)] text-[var(--cpm-red)]",
    amber: "bg-[var(--cpm-panel-alt)] text-[var(--cpm-accent)] border border-[var(--cpm-border-strong)]",
    blue: "bg-[var(--cpm-blue-soft)] text-[var(--cpm-blue)]",
    purple: "bg-[var(--cpm-purple-soft)] text-[var(--cpm-purple)]",
    green: "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)]",
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-[var(--cpm-accent)]" />
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Recent activity / data quality
        </div>
      </div>
      {recruiters.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-2">No recruiters added yet.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex-1 min-w-[150px] flex items-center gap-2 rounded-lg px-3 h-11 ${COLOR_CLS[item.color]}`}
              >
                <Icon size={15} strokeWidth={2} className="shrink-0" />
                <div className="min-w-0 leading-tight">
                  <div className="text-[13px] font-bold tabular-nums">{item.count}</div>
                  <div className="text-[9.5px] uppercase tracking-wide opacity-80 truncate">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {totalGaps === 0 && recruiters.length > 0 && (
        <div className="text-[11px] text-[var(--cpm-green)] mt-2">No coverage gaps — everything&apos;s assigned.</div>
      )}
    </div>
  );
}
