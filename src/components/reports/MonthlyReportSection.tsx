"use client";

import { useEffect, useMemo } from "react";
import {
  Award,
  Banknote,
  ClipboardList,
  Hourglass,
  Megaphone,
  Percent,
  Plus,
  TrendingUp,
  Trophy,
  UserX,
  Users,
} from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { formatMonthLabel } from "@/lib/recruiters";
import { StatCard } from "@/components/shared/StatCard";
import type { CarrierMonthlyStat, MonthlyReport, WeeklySubmissionStat } from "@/lib/carriers/types";
import { CarrierBreakdownTable } from "./CarrierBreakdownTable";
import { StateBreakdownTable } from "./StateBreakdownTable";
import { DqReasonsTable } from "./DqReasonsTable";

function bestCarrierOf(carriers: CarrierMonthlyStat[]): CarrierMonthlyStat | null {
  if (!carriers.length) return null;
  return carriers.reduce<CarrierMonthlyStat | null>((best, c) => {
    if (!best) return c;
    if ((c.hired ?? 0) !== (best.hired ?? 0)) return (c.hired ?? 0) > (best.hired ?? 0) ? c : best;
    return (c.submissions ?? 0) > (best.submissions ?? 0) ? c : best;
  }, null);
}

const inputCls =
  "bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

// Covers the "Class A Recruiting" monthly performance report the user
// provided (leads/DQP/Indeed spend + weekly submissions + per-carrier
// breakdown). Manual fields (leads, DQP, active recruiters, Indeed
// spend/accounts, CPL, best state) are hand-entered per month since this
// app has no ATS/Indeed API integration; everything else (Hire %,
// Leads→Hire %, Avg Submissions/Hires per recruiter, Best Carrier, totals)
// is computed live from the manual fields + the carrier rows below, never
// duplicated/fabricated. Supports arbitrary historical months (keyed
// "YYYY-MM"), unlike the forward-looking currentAndNextMonth() used by the
// Strategy Plan / recruiter actuals tables.
export function MonthlyReportSection() {
  const { monthlyReports, getMonthlyReport, updateMonthlyReport, reportsActiveMonth, setReportsActiveMonth } =
    useCarrierMap();

  const monthKeys = useMemo(() => Object.keys(monthlyReports).sort().reverse(), [monthlyReports]);

  const activeMonth =
    reportsActiveMonth && monthlyReports[reportsActiveMonth] ? reportsActiveMonth : monthKeys[0] ?? "";
  const report = activeMonth ? getMonthlyReport(activeMonth) : null;

  // Sync the context-level "active month" to this fallback as soon as we
  // know it, so the map's Hires color mode (which reads reportsActiveMonth
  // directly, outside this component) shows the same month's data the user
  // sees here by default, not an empty report before any pill is clicked.
  useEffect(() => {
    if (activeMonth && activeMonth !== reportsActiveMonth) {
      setReportsActiveMonth(activeMonth);
    }
  }, [activeMonth, reportsActiveMonth, setReportsActiveMonth]);

  const patch = (p: Partial<MonthlyReport>) => {
    if (!activeMonth) return;
    updateMonthlyReport(activeMonth, p);
  };

  const totalSubmissions = report ? report.carriers.reduce((s, c) => s + (c.submissions ?? 0), 0) : 0;
  const totalHired = report ? report.carriers.reduce((s, c) => s + (c.hired ?? 0), 0) : 0;
  const hireRate = totalSubmissions > 0 ? (totalHired / totalSubmissions) * 100 : null;
  const leadsToHireRate = report?.totalLeads && report.totalLeads > 0 ? (totalHired / report.totalLeads) * 100 : null;
  const avgSubPerRecruiter =
    report?.activeRecruiters && report.activeRecruiters > 0 ? totalSubmissions / report.activeRecruiters : null;
  const avgHiresPerRecruiter =
    report?.activeRecruiters && report.activeRecruiters > 0 ? totalHired / report.activeRecruiters : null;
  const bestCarrier = report ? bestCarrierOf(report.carriers) : null;
  // Drivers still active/pending a decision this month — everyone submitted
  // minus the two final outcomes (hired, disqualified). Computed, not
  // stored, so it can never drift out of sync with the carrier rows / DQ
  // field it's built from.
  const disqualified = report?.dqFromDqp ?? null;
  const driversInProcess =
    report && disqualified != null ? Math.max(0, totalSubmissions - totalHired - disqualified) : null;

  const updateWeek = (idx: number, p: Partial<WeeklySubmissionStat>) => {
    if (!report) return;
    const next = report.weeklySubmissions.slice();
    next[idx] = { ...next[idx], ...p };
    patch({ weeklySubmissions: next });
  };
  const addWeek = () => {
    if (!report) return;
    patch({ weeklySubmissions: [...report.weeklySubmissions, { label: "", submissions: null }] });
  };
  const removeWeek = (idx: number) => {
    if (!report) return;
    patch({ weeklySubmissions: report.weeklySubmissions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Monthly report
        </div>
        {/* Month switching + "Add month" now live in the sidebar
            (ReportsMonthNav) — the old pill row here only had room for 2-3
            months before overflowing. This just names which month is showing. */}
        {activeMonth && (
          <div className="text-[13px] font-semibold text-[var(--cpm-text)]">{formatMonthLabel(activeMonth)}</div>
        )}
      </div>

      {!report ? (
        <div className="text-[12.5px] text-[var(--cpm-text-faint)] italic py-4">
          No monthly report yet — add a month from the sidebar to start entering data.
        </div>
      ) : (
        <>
          {/* The 5 headline numbers: submissions, hires, DQPs, still-in-process,
              disqualified — the exact monthly breakdown asked for. */}
          <div className="flex flex-wrap gap-3 mb-3">
            <StatCard icon={Users} label="Submissions" value={totalSubmissions > 0 ? String(totalSubmissions) : "—"} sub="Sum of carrier rows" color="blue" />
            <StatCard icon={Award} label="Hires" value={totalHired > 0 ? String(totalHired) : "—"} sub="Sum of carrier rows" color="purple" />
            <StatCard icon={ClipboardList} label="DQPs" value={report.totalDqp != null ? String(report.totalDqp) : "—"} sub="Entered manually" color="amber" />
            <StatCard icon={Hourglass} label="In process" value={driversInProcess != null ? String(driversInProcess) : "—"} sub="Submissions − hires − disqualified" color="blue" />
            <StatCard icon={UserX} label="Disqualified" value={disqualified != null ? String(disqualified) : "—"} sub="DQ from DQP, entered manually" color="green" />
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <StatCard icon={Percent} label="Hire %" value={hireRate != null ? `${hireRate.toFixed(2)}%` : "—"} sub="Hires ÷ submissions" color="green" />
            <StatCard icon={TrendingUp} label="Leads → hire %" value={leadsToHireRate != null ? `${leadsToHireRate.toFixed(2)}%` : "—"} sub="Hires ÷ total leads" color="blue" />
            <StatCard icon={Users} label="Avg submissions / recruiter" value={avgSubPerRecruiter != null ? avgSubPerRecruiter.toFixed(1) : "—"} color="amber" />
            <StatCard icon={Award} label="Avg hires / recruiter" value={avgHiresPerRecruiter != null ? avgHiresPerRecruiter.toFixed(1) : "—"} color="amber" />
            <StatCard icon={Trophy} label="Best carrier" value={bestCarrier ? bestCarrier.carrier || "—" : "—"} sub={bestCarrier ? `${bestCarrier.hired ?? 0} hires` : undefined} color="green" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Total leads
              <input
                type="number"
                min={0}
                value={report.totalLeads ?? ""}
                placeholder="—"
                onChange={(e) => patch({ totalLeads: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Total DQP
              <input
                type="number"
                min={0}
                value={report.totalDqp ?? ""}
                placeholder="—"
                onChange={(e) => patch({ totalDqp: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              DQ from DQP
              <input
                type="number"
                min={0}
                value={report.dqFromDqp ?? ""}
                placeholder="—"
                onChange={(e) => patch({ dqFromDqp: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Active recruiters
              <input
                type="number"
                min={0}
                value={report.activeRecruiters ?? ""}
                placeholder="—"
                onChange={(e) => patch({ activeRecruiters: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Total Indeed spend ($)
              <input
                type="number"
                min={0}
                value={report.totalIndeedSpend ?? ""}
                placeholder="—"
                onChange={(e) => patch({ totalIndeedSpend: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Indeed accounts (total)
              <input
                type="number"
                min={0}
                value={report.indeedAccountsTotal ?? ""}
                placeholder="—"
                onChange={(e) => patch({ indeedAccountsTotal: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Indeed accounts (active)
              <input
                type="number"
                min={0}
                value={report.indeedAccountsActive ?? ""}
                placeholder="—"
                onChange={(e) => patch({ indeedAccountsActive: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
            <label className="text-[11px] text-[var(--cpm-text-faint)] flex flex-col gap-1">
              Average CPL ($)
              <input
                type="number"
                min={0}
                step="0.01"
                value={report.averageCpl ?? ""}
                placeholder="—"
                onChange={(e) => patch({ averageCpl: e.target.value === "" ? null : Number(e.target.value) })}
                className={`tabular-nums ${inputCls}`}
              />
            </label>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
                <Megaphone size={13} /> Weekly submissions
              </div>
              <button
                type="button"
                onClick={addWeek}
                className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[11.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)] transition-colors"
              >
                <Plus size={13} /> Add week
              </button>
            </div>
            {report.weeklySubmissions.length === 0 ? (
              <div className="text-[12.5px] text-[var(--cpm-text-faint)] italic">No weekly data entered yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {report.weeklySubmissions.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-2 h-9"
                  >
                    <input
                      type="text"
                      value={w.label}
                      placeholder="e.g. 8/3-8/8"
                      onChange={(e) => updateWeek(idx, { label: e.target.value })}
                      className="w-20 bg-transparent text-[12px] text-[var(--cpm-text)] outline-none"
                    />
                    <span className="text-[var(--cpm-text-faint)]">·</span>
                    <input
                      type="number"
                      min={0}
                      value={w.submissions ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateWeek(idx, { submissions: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="w-14 bg-transparent text-[12px] text-[var(--cpm-text)] outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => removeWeek(idx)}
                      className="text-[var(--cpm-text-faint)] hover:text-[var(--cpm-red)] transition-colors ml-1"
                      title="Remove week"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 rounded-lg border border-[var(--cpm-border-strong)] px-3 h-9 text-[12px] font-semibold text-[var(--cpm-text)]">
                  <Banknote size={13} className="text-[var(--cpm-accent)]" />
                  Total: {report.weeklySubmissions.reduce((s, w) => s + (w.submissions ?? 0), 0)}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <CarrierBreakdownTable month={activeMonth} />
            <StateBreakdownTable month={activeMonth} />
            <DqReasonsTable month={activeMonth} />
          </div>
        </>
      )}
    </div>
  );
}
