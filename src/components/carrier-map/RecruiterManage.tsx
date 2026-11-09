"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { RecruiterTeam } from "@/lib/carriers/types";
import { HandOverDialog } from "./HandOverDialog";

const TEAM_LABEL: Record<RecruiterTeam, string> = {
  uzbek: "Uzbek",
  philippines: "Philippines",
};

// Flag emoji render as plain "UZ"/"PH" text on Windows (no colorful flag
// glyphs in the system emoji font), so use real flag icon images instead —
// works the same on every OS. flagcdn.com serves free, standard ISO country
// flag SVGs.
const TEAM_FLAG_SRC: Record<RecruiterTeam, string> = {
  uzbek: "https://flagcdn.com/uz.svg",
  philippines: "https://flagcdn.com/ph.svg",
};

// Restyled to match the rest of the redesigned dashboard (Tailwind +
// var(--cpm-*) tokens, flat chips, gold accent button) instead of the old
// bright-green button / candy-pill-chip look. Same underlying data and
// handlers as before (recruiters / addRecruiter / removeRecruiter), plus a
// new outsourced-team filter (All / Uzbek / Philippines) and a per-recruiter
// team picker. The filter only affects this chip list — map, states, and
// reports are unaffected.
//
// Rendered inline inside the Sidebar (below the nav links, Dashboard route
// only) — not a standalone card, so it has no outer border/background of
// its own and blends into the sidebar's own background.
export function RecruiterManage() {
  const {
    strategyMode,
    recruiters,
    recruiterColor,
    addRecruiter,
    removeRecruiter,
    getRecruiterTeam,
    setRecruiterTeam,
    teamFilter,
    setTeamFilter,
    getRecruiterStatus,
    setRecruiterStatus,
    compareRecruitersByStatus,
    recruiterAssignments,
    recruiterAccounts,
    showFormer,
    setShowFormer,
    isNewRecruiter,
  } = useCarrierMap();
  const [offboarding, setOffboarding] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [newTeam, setNewTeam] = useState<RecruiterTeam | "">("");
  const [err, setErr] = useState("");

  if (!strategyMode) return null;

  const doAdd = () => {
    const trimmed = name.trim();
    const problem = addRecruiter(trimmed);
    if (problem) {
      setErr(problem);
      return;
    }
    if (newTeam) setRecruiterTeam(trimmed, newTeam);
    setName("");
    setNewTeam("");
    setErr("");
  };

  const teamRecruiters = recruiters
    .filter((r) => teamFilter === "all" || getRecruiterTeam(r) === teamFilter)
    .slice()
    .sort(compareRecruitersByStatus);
  const formerRecruiters = teamRecruiters.filter((r) => getRecruiterStatus(r) === "inactive");
  const visibleRecruiters = showFormer ? teamRecruiters : teamRecruiters.filter((r) => getRecruiterStatus(r) !== "inactive");
  // A former recruiter who still holds states or accounts (marked left before
  // hand-over existed) gets a "Hand over" button instead of losing that work.
  const stillHolds = (r: string) =>
    (recruiterAccounts[r]?.length ?? 0) > 0 || Object.values(recruiterAssignments).some((arr) => arr.includes(r));

  return (
    <div>
      <div className="mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Recruiters
        </div>
        <div className="text-[11px] text-[var(--cpm-text-faint)] mt-1">
          Add new hires or remove recruiters who&apos;ve left — updates the map + report instantly.
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {(["uzbek", "philippines"] as const).map((t) => (
          <button
            key={t}
            type="button"
            // Clicking the already-active flag clears the filter back to
            // "all" — this is the only way to reset now that the "All
            // teams" button is gone.
            onClick={() => setTeamFilter(teamFilter === t ? "all" : t)}
            title={teamFilter === t ? `${TEAM_LABEL[t]} (click to clear filter)` : TEAM_LABEL[t]}
            aria-label={TEAM_LABEL[t]}
            className={`h-7 px-2 rounded-lg transition-colors flex items-center justify-center ${
              teamFilter === t
                ? "bg-[var(--cpm-accent)]"
                : "bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] hover:border-[var(--cpm-border-strong)]"
            }`}
          >
            <img
              src={TEAM_FLAG_SRC[t]}
              alt={TEAM_LABEL[t]}
              className="w-5 h-3.5 object-cover rounded-[2px] ring-1 ring-black/20 shrink-0"
            />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {visibleRecruiters.map((r) => {
          const team = getRecruiterTeam(r) ?? "";
          const status = getRecruiterStatus(r);
          const inactive = status === "inactive";
          const isNew = !inactive && isNewRecruiter(r);
          return (
            <span
              key={r}
              className={`w-full flex flex-wrap items-center gap-x-2 gap-y-1 pl-2.5 pr-1.5 py-1.5 rounded-lg text-[12.5px] font-medium bg-[var(--cpm-panel-alt)] border transition-colors ${
                inactive
                  ? "border-[var(--cpm-red)] text-[#ff9a9d]"
                  : isNew
                    ? "border-[#0ea5e9] text-[#7dd3fc]"
                    : "border-[var(--cpm-border)] text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)]"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                style={{ background: recruiterColor(r) }}
              />
              <span className="flex-1 min-w-0 truncate" title={r}>
                {r}
              </span>
              {inactive && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#ff9a9d]">Former</span>
              )}
              {isNew && <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded border border-[#0ea5e9] text-[#38bdf8] bg-[#0ea5e9]/15" title="New recruiter: shown in blue until their first hire">New</span>}
              <button
                type="button"
                title={`Remove ${r} for good`}
                aria-label={`Remove ${r}`}
                onClick={() => {
                  if (!confirm(`Remove ${r} for good? Their states, accounts and plan will be cleared.`)) return;
                  removeRecruiter(r);
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] text-[var(--cpm-text-faint)] hover:bg-[var(--cpm-red)] hover:text-white transition-colors shrink-0"
              >
                ✕
              </button>
              <span className="w-full flex items-center gap-1.5 pl-[18px]">
              <button
                type="button"
                title={inactive ? `Mark ${r} active` : `Mark ${r} inactive (left/fired)`}
                onClick={() => (inactive ? setRecruiterStatus(r, "active") : setOffboarding(r))}
                className={`h-5 px-1.5 rounded border text-[10.5px] transition-colors ${
                  inactive
                    ? "border-[var(--cpm-red)] text-[#ff9a9d] hover:bg-[var(--cpm-red)] hover:text-white"
                    : "border-[var(--cpm-border)] text-[var(--cpm-text-faint)] hover:border-[var(--cpm-border-strong)]"
                }`}
              >
                {inactive ? "Reactivate" : "Mark left"}
              </button>
              {inactive && stillHolds(r) && (
                <button
                  type="button"
                  title={`Hand over ${r}'s states and accounts`}
                  onClick={() => setOffboarding(r)}
                  className="h-5 px-1.5 whitespace-nowrap rounded border border-[var(--cpm-accent)] text-[10.5px] text-[var(--cpm-accent-strong)] hover:bg-[var(--cpm-accent)] hover:text-[#241800] transition-colors"
                >
                  Hand over
                </button>
              )}
              <select
                value={team}
                onChange={(e) => setRecruiterTeam(r, (e.target.value || null) as RecruiterTeam | null)}
                title={`${r}'s outsourced team`}
                className="h-5 rounded border border-[var(--cpm-border)] bg-[var(--cpm-panel)] text-[10.5px] text-[var(--cpm-text-faint)] outline-none focus:border-[var(--cpm-accent)]"
              >
                <option value="">Unassigned</option>
                <option value="uzbek">Uzbek</option>
                <option value="philippines">Philippines</option>
              </select>
              </span>
            </span>
          );
        })}
        {visibleRecruiters.length === 0 && (
          <span className="text-[11.5px] text-[var(--cpm-text-faint)] italic">No recruiters on this team yet.</span>
        )}
      </div>

      {formerRecruiters.length > 0 && (
        <button
          type="button"
          onClick={() => setShowFormer(!showFormer)}
          className="w-full mb-2 text-left text-[11.5px] font-semibold text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)]"
        >
          {showFormer ? "Hide former recruiters" : `Show ${formerRecruiters.length} former ${formerRecruiters.length === 1 ? "recruiter" : "recruiters"}`}
        </button>
      )}

      {showFormer && formerRecruiters.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (!confirm(`Remove all ${formerRecruiters.length} former recruiters for good?

${formerRecruiters.join(", ")}`)) return;
            formerRecruiters.forEach((r) => removeRecruiter(r));
          }}
          className="w-full mb-3 h-8 rounded-lg border border-[var(--cpm-red)] text-[12px] font-semibold text-[#ff9a9d] hover:bg-[var(--cpm-red)] hover:text-white transition-colors"
        >
          Remove all {formerRecruiters.length} former recruiters
        </button>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[var(--cpm-border)]">
        <input
          type="text"
          placeholder="New recruiter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doAdd();
            }
          }}
          className="flex-1 min-w-[170px] px-2.5 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] outline-none focus:border-[var(--cpm-accent)]"
        />
        <select
          value={newTeam}
          onChange={(e) => setNewTeam(e.target.value as RecruiterTeam | "")}
          title="New recruiter's outsourced team"
          className="h-8 px-2 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
        >
          <option value="">Unassigned</option>
          <option value="uzbek">Uzbek</option>
          <option value="philippines">Philippines</option>
        </select>
        <button
          type="button"
          onClick={doAdd}
          className="px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)] transition-colors"
        >
          + Add recruiter
        </button>
        {err && <span className="text-[11.5px] text-[var(--cpm-red)] w-full">{err}</span>}
      </div>
      {offboarding && <HandOverDialog from={offboarding} onClose={() => setOffboarding(null)} />}
    </div>
  );
}
