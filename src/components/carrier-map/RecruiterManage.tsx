"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { RecruiterTeam } from "@/lib/carriers/types";

const TEAM_LABEL: Record<RecruiterTeam, string> = {
  uzbek: "Uzbek",
  philippines: "Philippines",
};

// Restyled to match the rest of the redesigned dashboard (Tailwind +
// var(--cpm-*) tokens, flat chips, gold accent button) instead of the old
// bright-green button / candy-pill-chip look. Same underlying data and
// handlers as before (recruiters / addRecruiter / removeRecruiter), plus a
// new outsourced-team filter (All / Uzbek / Philippines) and a per-recruiter
// team picker. The filter only affects this chip list (and the matching
// chip list in RecruiterPanel) — map, states, and reports are unaffected.
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
  } = useCarrierMap();
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

  const visibleRecruiters = recruiters.filter((r) => teamFilter === "all" || getRecruiterTeam(r) === teamFilter);

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
        {(["all", "uzbek", "philippines"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTeamFilter(t)}
            className={`px-2.5 h-7 rounded-lg text-[11.5px] font-semibold transition-colors ${
              teamFilter === t
                ? "bg-[var(--cpm-accent)] text-[#241800]"
                : "bg-[var(--cpm-panel-alt)] text-[var(--cpm-text-dim)] border border-[var(--cpm-border)] hover:border-[var(--cpm-border-strong)]"
            }`}
          >
            {t === "all" ? "All teams" : TEAM_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {visibleRecruiters.map((r) => {
          const team = getRecruiterTeam(r) ?? "";
          return (
            <span
              key={r}
              className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg text-[12.5px] font-medium text-[var(--cpm-text)] bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] hover:border-[var(--cpm-border-strong)] transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                style={{ background: recruiterColor(r) }}
              />
              {r}
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
              <button
                type="button"
                title={`Remove ${r}`}
                onClick={() => {
                  if (!confirm(`Remove ${r}? Their state assignments will be cleared.`)) return;
                  removeRecruiter(r);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-[var(--cpm-text-faint)] hover:bg-[var(--cpm-red)] hover:text-white transition-colors"
              >
                ✕
              </button>
            </span>
          );
        })}
        {visibleRecruiters.length === 0 && (
          <span className="text-[11.5px] text-[var(--cpm-text-faint)] italic">No recruiters on this team yet.</span>
        )}
      </div>

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
    </div>
  );
}
