"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { currentAndNextMonth } from "@/lib/recruiters";
import { exportTeamReportToExcel, type TeamReportRow } from "@/lib/exportRecruiterReport";
import type { RecruiterTeam } from "@/lib/carriers/types";

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

// Full team report: every recruiter's target vs. actual submissions/hires
// for a chosen month (current or next — same two months tracked by
// MonthlyTargetActualTable, same recruiterActuals data), plus their
// states/carriers footprint, in one exportable table. Actuals are entered
// by hand (there's no ATS/data source yet), editable right in this table —
// same underlying updateRecruiterActual() as the single-recruiter dashboard
// table, so numbers entered in either place show up in both.
export function ReportsDashboard() {
  const {
    strategyMode,
    recruiters,
    recruiterColor,
    recruiterAssignments,
    teamFilter,
    setTeamFilter,
    getRecruiterTeam,
    getRecruiterPlan,
    getRecruiterActual,
    updateRecruiterActual,
  } = useCarrierMap();

  const months = currentAndNextMonth();
  const [monthIdx, setMonthIdx] = useState(0);
  const month = months[monthIdx];

  if (!strategyMode) {
    return (
      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 text-[13px] text-[var(--cpm-text-faint)]">
        Turn on Strategy mode (on the Dashboard) to see recruiter reports.
      </div>
    );
  }

  const visible = recruiters.filter((r) => teamFilter === "all" || getRecruiterTeam(r) === teamFilter);

  const rows = visible.map((r) => {
    const plan = getRecruiterPlan(r);
    const actual = getRecruiterActual(r, month.key);
    const statesCount = Object.keys(recruiterAssignments).filter((s) =>
      (recruiterAssignments[s] || []).includes(r)
    ).length;
    return { name: r, team: getRecruiterTeam(r), plan, actual, statesCount };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      targetSub: acc.targetSub + (row.plan.targetSubmissions ?? 0),
      actualSub: acc.actualSub + (row.actual.submissions ?? 0),
      targetHires: acc.targetHires + (row.plan.targetHires ?? 0),
      actualHires: acc.actualHires + (row.actual.hires ?? 0),
    }),
    { targetSub: 0, actualSub: 0, targetHires: 0, actualHires: 0 }
  );

  const handleExport = () => {
    const exportRows: TeamReportRow[] = rows.map((row) => ({
      Recruiter: row.name,
      Team: row.team ? TEAM_LABEL[row.team] : "Unassigned",
      Month: month.label,
      "Target Submissions": row.plan.targetSubmissions ?? "",
      "Actual Submissions": row.actual.submissions ?? "",
      "Target Hires": row.plan.targetHires ?? "",
      "Actual Hires": row.actual.hires ?? "",
      "Hire Rate": hireRateOf(row.actual.hires, row.actual.submissions),
      "States Assigned": row.statesCount,
      "Carriers Assigned": row.plan.carriers.length,
    }));
    exportTeamReportToExcel(exportRows, month.label);
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
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
            onClick={handleExport}
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
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                <td className="py-1.5 pr-3">
                  <span className="inline-flex items-center gap-2 text-[var(--cpm-text)] font-semibold">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                      style={{ background: recruiterColor(row.name) }}
                    />
                    {row.name}
                  </span>
                </td>
                <td className="py-1.5 pr-3">{row.team ? TEAM_LABEL[row.team] : "—"}</td>
                <td className="py-1.5 pr-3 tabular-nums">{row.statesCount}</td>
                <td className="py-1.5 pr-3 tabular-nums">{row.plan.carriers.length}</td>
                <td className="py-1.5 pr-3">
                  <span className="tabular-nums">{row.plan.targetSubmissions ?? "—"}</span> /{" "}
                  <input
                    type="number"
                    min={0}
                    value={row.actual.submissions ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      updateRecruiterActual(row.name, month.key, {
                        submissions: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-14 bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <span className="tabular-nums">{row.plan.targetHires ?? "—"}</span> /{" "}
                  <input
                    type="number"
                    min={0}
                    value={row.actual.hires ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      updateRecruiterActual(row.name, month.key, {
                        hires: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-14 bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
                  />
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">
                  {hireRateOf(row.actual.hires, row.actual.submissions)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-[12.5px] text-[var(--cpm-text-faint)] italic">
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
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
