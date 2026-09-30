"use client";

import { useState } from "react";
import { ALL_STATES, CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { RECRUITER_TARGET } from "@/lib/recruiters";

const COLLAPSED_COUNT = 3;

// Restyled from an inline "Name: count" chip row into a vertical one-row-
// per-recruiter list (Tailwind + var(--cpm-*) tokens, matching the rest of
// the redesigned dashboard) so each recruiter's monthly targets (from their
// Strategy Plan, via getRecruiterPlan), full assigned-states list (same
// recruiterAssignments data RecruiterStrategyPlan/RecruiterReport already
// use), and assigned carriers (plan.carriers, same data AssignedCarriersPanel
// already reads/writes) are visible at a glance. Click behavior is
// unchanged: clicking a row selects recruiterFilter (opens Strategy Plan +
// report below), clicking the selected row again clears it.
//
// Once the roster (for the current team filter) grows past COLLAPSED_COUNT,
// only the first few rows show by default with a "Show all (N)" toggle
// below the list — keeps the panel from growing to one screen-height per
// recruiter as the team scales past a handful of people.
export function RecruiterPanel() {
  const {
    strategyMode,
    recruiters,
    recruiterColor,
    recruiterAssignments,
    recruiterFilter,
    setRecruiterFilter,
    teamFilter,
    getRecruiterTeam,
    getRecruiterPlan,
  } = useCarrierMap();
  const [expanded, setExpanded] = useState(false);
  if (!strategyMode) return null;

  const unassignedCount =
    ALL_STATES.length - Object.keys(recruiterAssignments).filter((s) => recruiterAssignments[s]?.length).length;

  const visibleRecruiters = recruiters.filter((r) => teamFilter === "all" || getRecruiterTeam(r) === teamFilter);
  const hasMore = visibleRecruiters.length > COLLAPSED_COUNT;
  const shownRecruiters = expanded ? visibleRecruiters : visibleRecruiters.slice(0, COLLAPSED_COUNT);

  return (
    <div id="recruiterPanel" className="mb-3 rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-3">
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-2">
        Click a recruiter to open their Strategy Plan + full report:
      </div>

      <div className="flex flex-col gap-1.5">
        {shownRecruiters.map((r) => {
          const plan = getRecruiterPlan(r);
          const states = Object.keys(recruiterAssignments)
            .filter((s) => (recruiterAssignments[s] || []).includes(r))
            .sort();
          const over = states.length > RECRUITER_TARGET;
          const selected = recruiterFilter === r;

          return (
            <div
              key={r}
              onClick={() => setRecruiterFilter(selected ? "" : r)}
              className={`rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                selected
                  ? "border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)]"
                  : "border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] hover:border-[var(--cpm-border-strong)]"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10" style={{ background: recruiterColor(r) }} />
                <span className="text-[13px] font-semibold text-[var(--cpm-text)]">{r}</span>
                <span className="text-[11.5px] text-[var(--cpm-text-dim)]">
                  Target: {plan.targetSubmissions ?? "—"} subs / {plan.targetHires ?? "—"} hires
                </span>
                {over && (
                  <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--cpm-red-soft)] text-[#ff9a9d] border border-[var(--cpm-red)]">
                    Over target
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-[var(--cpm-text-faint)]">
                States assigned ({states.length}): {states.length ? states.join(", ") : "none yet"}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--cpm-text-faint)]">
                Carriers assigned ({plan.carriers.length}):{" "}
                {plan.carriers.length ? plan.carriers.map((id) => CARRIERS[id].label).join(", ") : "none yet"}
              </div>
            </div>
          );
        })}
        {visibleRecruiters.length === 0 && (
          <span className="text-[11.5px] text-[var(--cpm-text-faint)] italic">No recruiters on this team yet.</span>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-[11.5px] font-semibold text-[var(--cpm-accent)] hover:text-[var(--cpm-accent-strong)]"
        >
          {expanded ? "▲ Show less" : `▼ Show all (${visibleRecruiters.length})`}
        </button>
      )}

      <div className="mt-2 flex items-center gap-2 flex-wrap text-[11.5px] text-[var(--cpm-text-faint)]">
        <span>Unassigned: {unassignedCount}</span>
        {recruiterFilter && (
          <button
            type="button"
            onClick={() => setRecruiterFilter("")}
            className="text-[#ff9a9d] hover:underline"
          >
            ✕ Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
