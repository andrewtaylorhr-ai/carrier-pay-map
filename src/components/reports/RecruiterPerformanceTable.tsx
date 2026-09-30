"use client";

import type { CSSProperties } from "react";
import type { RecruiterActual, RecruiterPlan, RecruiterStatus, RecruiterTeam } from "@/lib/carriers/types";
import type { MonthOption } from "@/lib/recruiters";

const TEAM_LABEL: Record<RecruiterTeam, string> = {
  uzbek: "Uzbek",
  philippines: "Philippines",
};

const TEAM_FLAG_SRC: Record<RecruiterTeam, string> = {
  uzbek: "https://flagcdn.com/uz.svg",
  philippines: "https://flagcdn.com/ph.svg",
};

function hireRateOf(hires: number | null, submissions: number | null): string {
  if (!submissions || submissions <= 0 || hires == null) return "—";
  return `${Math.round((hires / submissions) * 100)}%`;
}

// Status is derived purely from real target/actual numbers already on
// screen (submissions ratio) — a label, not a fabricated metric. Colors use
// inline style (not Tailwind's `/opacity` arbitrary-value modifier) since
// --cpm-accent is a plain hex custom property, not an rgb-channel triplet
// that modifier syntax needs.
function statusOf(target: number | null, actual: number | null): { label: string; cls: string; style?: CSSProperties } {
  const neutral = "bg-[var(--cpm-panel-alt)] text-[var(--cpm-text-faint)] border border-[var(--cpm-border-strong)]";
  if (target == null || target <= 0) return { label: "No target", cls: neutral };
  if (actual == null) return { label: "No data", cls: neutral };
  const ratio = actual / target;
  if (ratio >= 1) return { label: "On track", cls: "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)]" };
  if (ratio >= 0.6)
    return {
      label: "Behind",
      cls: "",
      style: { background: "rgba(212,161,55,0.18)", color: "var(--cpm-accent)" },
    };
  return { label: "Below target", cls: "bg-[var(--cpm-red-soft)] text-[var(--cpm-red)]" };
}

export interface PerformanceRow {
  name: string;
  team: RecruiterTeam | null;
  plan: RecruiterPlan;
  actual: RecruiterActual;
  statesCount: number;
  status: RecruiterStatus;
}

export function RecruiterPerformanceTable({
  rows,
  totals,
  months,
  monthIdx,
  setMonthIdx,
  teamFilter,
  setTeamFilter,
  recruiterColor,
  onExport,
}: {
  rows: PerformanceRow[];
  totals: { targetSub: number; actualSub: number; targetHires: number; actualHires: number };
  months: MonthOption[];
  monthIdx: number;
  setMonthIdx: (i: number) => void;
  teamFilter: "all" | RecruiterTeam;
  setTeamFilter: (f: "all" | RecruiterTeam) => void;
  recruiterColor: (name: string) => string;
  onExport: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Recruiter performance
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-0.5">
          {months.map((m, i) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMonthIdx(i)}
              className={`px-3 h-7 rounded-md text-[12px] font-semibold transition-colors ${
                monthIdx === i
                  ? "bg-[var(--cpm-accent)] text-[#241800]"
                  : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {(["uzbek", "philippines"] as const).map((t) => (
              <button
                key={t}
                type="button"
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
          <button
            type="button"
            onClick={onExport}
            className="px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)] transition-colors"
          >
            ⬇ Export to Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">Recruiter</th>
              <th className="py-1.5 pr-3 font-semibold">Team</th>
              <th className="py-1.5 pr-3 font-semibold">States</th>
              <th className="py-1.5 pr-3 font-semibold">Carriers</th>
              <th className="py-1.5 pr-3 font-semibold">Submissions (Target / Actual)</th>
              <th className="py-1.5 pr-3 font-semibold">Hires (Target / Actual)</th>
              <th className="py-1.5 pr-3 font-semibold">Hire rate</th>
              <th className="py-1.5 pr-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = statusOf(row.plan.targetSubmissions, row.actual.submissions);
              const inactive = row.status === "inactive";
              return (
                <tr key={row.name} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                  <td className="py-1.5 pr-3">
                    <span
                      className={`inline-flex items-center gap-2 font-semibold ${
                        inactive ? "text-[#ff9a9d]" : "text-[var(--cpm-text)]"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                        style={{ background: recruiterColor(row.name) }}
                      />
                      {row.name}
                      {inactive && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#ff9a9d]">
                          Former
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3">{row.team ? TEAM_LABEL[row.team] : "—"}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{row.statesCount}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{row.plan.carriers.length}</td>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {row.plan.targetSubmissions ?? "—"} / {row.actual.submissions ?? "—"}
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {row.plan.targetHires ?? "—"} / {row.actual.hires ?? "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">
                    {hireRateOf(row.actual.hires, row.actual.submissions)}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.cls}`}
                      style={status.style}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-[12.5px] text-[var(--cpm-text-faint)] italic">
                  No recruiters on this team yet.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[var(--cpm-border-strong)] text-[var(--cpm-text)] font-semibold">
                <td className="py-1.5 pr-3" colSpan={4}>
                  Team total ({rows.length} recruiter{rows.length > 1 ? "s" : ""})
                </td>
                <td className="py-1.5 pr-3 tabular-nums">
                  {totals.targetSub || "—"} / {totals.actualSub || "—"}
                </td>
                <td className="py-1.5 pr-3 tabular-nums">
                  {totals.targetHires || "—"} / {totals.actualHires || "—"}
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] font-normal">
                  {hireRateOf(totals.actualHires, totals.actualSub)}
                </td>
                <td className="py-1.5 pr-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
