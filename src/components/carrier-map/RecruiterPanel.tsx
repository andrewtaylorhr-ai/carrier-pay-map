"use client";

import { useState } from "react";
import { ALL_STATES, CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { RECRUITER_TARGET } from "@/lib/recruiters";

const COLLAPSED_COUNT = 5;

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
    recruiterAccounts,
    assignments,
    recruiterFilter,
    setRecruiterFilter,
    teamFilter,
    getRecruiterTeam,
    getRecruiterPlan,
    getRecruiterStatus,
    compareRecruitersByStatus,
    showFormer,
    setShowFormer,
  } = useCarrierMap();
  const [expanded, setExpanded] = useState(false);
  if (!strategyMode) return null;

  const unassignedCount =
    ALL_STATES.length - Object.keys(recruiterAssignments).filter((s) => recruiterAssignments[s]?.length).length;

  const teamRecruiters = recruiters
    .filter((r) => teamFilter === "all" || getRecruiterTeam(r) === teamFilter)
    .slice()
    .sort(compareRecruitersByStatus);
  const formerCount = teamRecruiters.filter((r) => getRecruiterStatus(r) === "inactive").length;
  const visibleRecruiters = showFormer ? teamRecruiters : teamRecruiters.filter((r) => getRecruiterStatus(r) !== "inactive");
  const hasMore = visibleRecruiters.length > COLLAPSED_COUNT;
  const shownRecruiters = expanded ? visibleRecruiters : visibleRecruiters.slice(0, COLLAPSED_COUNT);

  const cell = "px-3 py-2.5 align-top";
  return (
    <div id="recruiterPanel" className="mb-3 rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-[var(--cpm-border)]">
        <div className="text-[14px] font-semibold text-[var(--cpm-text)]">
          Recruiters <span className="text-[var(--cpm-text-faint)] font-normal">({visibleRecruiters.length})</span>
        </div>
        <div className="text-[12px] text-[var(--cpm-text-faint)]">Click a row to open their Strategy Plan and report</div>
        <div className="ml-auto flex items-center gap-2">
          {formerCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFormer(!showFormer)}
              className="text-[11.5px] font-semibold px-2 py-1 rounded-md border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
            >
              {showFormer ? "Hide former" : `Show former (${formerCount})`}
            </button>
          )}
          <span
            className={`text-[11.5px] font-semibold px-2 py-1 rounded-md border ${
              unassignedCount
                ? "bg-[var(--cpm-red-soft)] text-[#ff9a9d] border-[var(--cpm-red)]"
                : "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)] border-[var(--cpm-green)]"
            }`}
          >
            {unassignedCount} {unassignedCount === 1 ? "state" : "states"} without a recruiter
          </span>
          {recruiterFilter && (
            <button
              type="button"
              onClick={() => setRecruiterFilter("")}
              className="text-[11.5px] font-semibold px-2 py-1 rounded-md border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
            >
              ✕ Clear selection
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wider text-[var(--cpm-text-faint)]">
              <th className="px-3 py-2 font-semibold w-[190px]">Recruiter</th>
              <th className="px-3 py-2 font-semibold w-[150px]">Monthly target</th>
              <th className="px-3 py-2 font-semibold">States</th>
              <th className="px-3 py-2 font-semibold">Carriers</th>
              <th className="px-3 py-2 font-semibold text-right w-[90px]">Accounts</th>
            </tr>
          </thead>
          <tbody>
            {shownRecruiters.map((r) => {
              const plan = getRecruiterPlan(r);
              const states = Object.keys(recruiterAssignments)
                .filter((s) => (recruiterAssignments[s] || []).includes(r))
                .sort();
              // carriers on this recruiter's states, plus any tagged in their Strategy Plan
              const carriers = CARRIER_ORDER.filter(
                (id) => plan.carriers.includes(id) || states.some((s) => (assignments[s] || []).includes(id))
              );
              const over = states.length > RECRUITER_TARGET;
              const selected = recruiterFilter === r;
              const inactive = getRecruiterStatus(r) === "inactive";
              const team = getRecruiterTeam(r);

              return (
                <tr
                  key={r}
                  onClick={() => setRecruiterFilter(selected ? "" : r)}
                  className={`cursor-pointer border-t border-[var(--cpm-border)] transition-colors ${
                    selected ? "bg-[rgba(212,161,55,0.10)]" : "hover:bg-[var(--cpm-panel-alt)]"
                  }`}
                  style={selected ? { boxShadow: "inset 3px 0 0 var(--cpm-accent)" } : undefined}
                >
                  <td className={cell}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: recruiterColor(r) }} />
                      <span className={`font-semibold ${inactive ? "text-[#ff9a9d]" : "text-[var(--cpm-text)]"}`}>{r}</span>
                      {team && (
                        <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-[var(--cpm-panel-alt)] text-[var(--cpm-text-dim)] border border-[var(--cpm-border)]">
                          {team === "uzbek" ? "UZ" : "PH"}
                        </span>
                      )}
                    </div>
                    {inactive && <div className="mt-1 text-[10.5px] font-semibold text-[#ff9a9d]">Former recruiter</div>}
                  </td>
                  <td className={`${cell} text-[var(--cpm-text-dim)] whitespace-nowrap`}>
                    {plan.targetSubmissions || plan.targetHires ? (
                      <>
                        <b className="text-[var(--cpm-text)]">{plan.targetSubmissions ?? "—"}</b> subs ·{" "}
                        <b className="text-[var(--cpm-text)]">{plan.targetHires ?? "—"}</b> hires
                      </>
                    ) : (
                      <span className="text-[var(--cpm-text-faint)]">Not set</span>
                    )}
                  </td>
                  <td className={cell}>
                    {states.length ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`text-[11.5px] font-bold mr-1 tabular-nums ${over ? "text-[#ff9a9d]" : "text-[var(--cpm-text)]"}`}
                          title={over ? `Over the ${RECRUITER_TARGET}-state target` : undefined}
                        >
                          {states.length}
                        </span>
                        {states.map((s) => (
                          <span
                            key={s}
                            title={s}
                            className="text-[10.5px] font-semibold px-1.5 py-px rounded bg-[var(--cpm-panel-alt)] text-[var(--cpm-text-dim)] border border-[var(--cpm-border)]"
                          >
                            {STATE_CODE[s] ?? s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--cpm-text-faint)]">None yet</span>
                    )}
                  </td>
                  <td className={cell}>
                    {carriers.length ? (
                      <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap">
                        {carriers.map((id) => (
                          <span key={id} className="flex items-center gap-1 text-[11.5px] text-[var(--cpm-text-dim)] whitespace-nowrap">
                            <i className="w-2 h-2 rounded-full inline-block" style={{ background: CARRIERS[id].color }} />
                            {CARRIERS[id].label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--cpm-text-faint)]">None yet</span>
                    )}
                  </td>
                  <td className={`${cell} text-right font-semibold text-[var(--cpm-text)] tabular-nums`}>
                    {(recruiterAccounts[r] || []).length.toLocaleString("en-US")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleRecruiters.length === 0 && (
          <div className="px-4 py-4 text-[12px] text-[var(--cpm-text-faint)] italic">No recruiters on this team yet.</div>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full border-t border-[var(--cpm-border)] py-2 text-[12px] font-semibold text-[var(--cpm-accent)] hover:text-[var(--cpm-accent-strong)] hover:bg-[var(--cpm-panel-alt)] rounded-b-xl"
        >
          {expanded ? "Show less ▲" : `Show all ${visibleRecruiters.length} recruiters ▼`}
        </button>
      )}
    </div>
  );
}
