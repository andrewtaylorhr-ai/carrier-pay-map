"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { RecruiterTeam } from "@/lib/carriers/types";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { EMPTY_TRACKER, totalHires, type TrackerData } from "@/lib/tracker";
import { programProgress } from "@/lib/training-program";
import {
  NEW_RECRUITER_COLOR,
  QC_DAYS,
  TRAINING_DAYS,
  type Trainee,
  formatDay,
  stepStatus,
  todayISO,
  workDaysBetween,
} from "@/lib/trainees";

type View = "training" | "qc" | "approved" | "graduated" | "dropped";
type Filter = "active" | View | "all";

const VIEW: Record<View, { label: string; color: string }> = {
  training: { label: "Training", color: "#f59e0b" },
  qc: { label: "Quality control", color: "#a855f7" },
  approved: { label: "New recruiter", color: NEW_RECRUITER_COLOR },
  graduated: { label: "Recruiter", color: "#16a34a" },
  dropped: { label: "Dropped", color: "#9aa0ad" },
};

const viewOf = (t: Trainee): View => (t.stage === "approved" && t.firstHireAt ? "graduated" : t.stage);
const TEAM_LABEL: Record<RecruiterTeam, string> = { uzbek: "Uzbek", philippines: "Philippines" };

const btn = "h-7 px-2.5 rounded-md text-[11.5px] font-semibold border transition-colors whitespace-nowrap";
const btnMain = `${btn} border-[var(--cpm-accent)] bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)]`;
const btnGhost = `${btn} border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]`;
const input =
  "h-9 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[13px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

// Manager's controller for new recruiters: add them, follow each one through
// training and quality control by date, approve them onto the roster, and
// see who is still waiting on their first hire.
export function ControllerApp() {
  const { trainees, addTrainee, updateTrainee, removeTrainee, approveTrainee, recruiterActuals } = useCarrierMap();
  const [tracker] = useLocalStorageState<TrackerData>("cdlPayMapTracker", EMPTY_TRACKER);
  const today = todayISO();

  const [name, setName] = useState("");
  const [team, setTeam] = useState<RecruiterTeam | "">("");
  const [start, setStart] = useState(today);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Hires per person from the Daily Tracker plus hand-entered monthly actuals.
  const hires = useMemo(() => {
    const out: Record<string, number> = {};
    for (const month of Object.values(tracker.months)) for (const [r, row] of Object.entries(month)) out[r] = (out[r] ?? 0) + totalHires(row);
    for (const [r, months] of Object.entries(recruiterActuals)) for (const a of Object.values(months)) out[r] = (out[r] ?? 0) + (a.hires ?? 0);
    return out;
  }, [tracker, recruiterActuals]);

  // A new recruiter graduates as soon as a hire shows up for them.
  useEffect(() => {
    for (const [n, t] of Object.entries(trainees)) if (t.stage === "approved" && !t.firstHireAt && (hires[n] ?? 0) > 0) updateTrainee(n, { firstHireAt: today });
  }, [trainees, hires, updateTrainee, today]);

  const all = Object.entries(trainees).map(([n, t]) => ({ name: n, t, view: viewOf(t), step: stepStatus(t, today) }));
  const counts = Object.fromEntries((Object.keys(VIEW) as View[]).map((v) => [v, all.filter((x) => x.view === v).length])) as Record<View, number>;
  const late = all.filter((x) => x.step && x.step.late > 0).length;

  const rows = all
    .filter((x) => (filter === "all" ? true : filter === "active" ? ["training", "qc", "approved"].includes(x.view) : x.view === filter))
    .filter((x) => !query.trim() || x.name.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((x) => (!from || x.t.start >= from) && (!to || x.t.start <= to))
    .sort((a, b) => b.t.start.localeCompare(a.t.start) || a.name.localeCompare(b.name));

  const doAdd = () => {
    const problem = addTrainee(name, team || null, start || today);
    if (problem) return setErr(problem);
    setName("");
    setTeam("");
    setStart(today);
    setErr("");
  };

  const approve = (n: string) => {
    const problem = approveTrainee(n);
    if (problem) alert(problem);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Stat label="In training" value={counts.training} color={VIEW.training.color} />
        <Stat label="Quality control" value={counts.qc} color={VIEW.qc.color} />
        <Stat label="New, waiting for 1st hire" value={counts.approved} color={VIEW.approved.color} />
        <Stat label="Became recruiters" value={counts.graduated} color={VIEW.graduated.color} />
        <Stat label="Late" value={late} color={late ? "#e5484d" : "var(--cpm-text-faint)"} />
      </div>

      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3">
        <div className="text-[14px] font-bold text-[var(--cpm-text)] mb-2">Add a new recruiter</div>
        <div className="flex items-end gap-2 flex-wrap">
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
            Name
            <input
              className={`${input} w-[220px]`}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doAdd()}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
            Team
            <select className={input} value={team} onChange={(e) => setTeam(e.target.value as RecruiterTeam | "")}>
              <option value="">Unassigned</option>
              <option value="uzbek">Uzbek</option>
              <option value="philippines">Philippines</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
            Training starts
            <input type="date" className={input} value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <button type="button" onClick={doAdd} className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)]">
            + Add to training
          </button>
          {err && <span className="text-[12px] text-[var(--cpm-red)] w-full">{err}</span>}
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11.5px] text-[var(--cpm-text-faint)]">
          <Step color={VIEW.training.color} text={`Training · ${TRAINING_DAYS} working days`} />
          <span>→</span>
          <Step color={VIEW.qc.color} text={`Quality control on calls · ${QC_DAYS} working days`} />
          <span>→</span>
          <Step color={VIEW.approved.color} text="Approved: added to recruiters, shown as New" />
          <span>→</span>
          <Step color={VIEW.graduated.color} text="First driver hired: full recruiter" />
          <span className="ml-1">(working days are Mon–Sat)</span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
        <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-[var(--cpm-border)]">
          <div className="segTabs flex-wrap">
            {(
              [
                ["active", "In progress", counts.training + counts.qc + counts.approved],
                ["training", VIEW.training.label, counts.training],
                ["qc", VIEW.qc.label, counts.qc],
                ["approved", VIEW.approved.label, counts.approved],
                ["graduated", VIEW.graduated.label, counts.graduated],
                ["dropped", VIEW.dropped.label, counts.dropped],
                ["all", "All", all.length],
              ] as [Filter, string, number][]
            ).map(([id, label, n]) => (
              <button key={id} type="button" className={filter === id ? "active" : undefined} onClick={() => setFilter(id)}>
                {label} <span className="opacity-70">{n}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap text-[12px] text-[var(--cpm-text-faint)]">
            <input className={`${input} h-8 w-[160px]`} placeholder="Search name" value={query} onChange={(e) => setQuery(e.target.value)} />
            Started
            <input type="date" className={`${input} h-8`} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Started from" />
            to
            <input type="date" className={`${input} h-8`} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Started to" />
            {(from || to) && (
              <button type="button" className={btnGhost} onClick={() => (setFrom(""), setTo(""))}>
                Clear dates
              </button>
            )}
          </div>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-[var(--cpm-text-faint)]">
                  <th className="px-4 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Stage</th>
                  <th className="px-3 py-2 font-semibold">Started</th>
                  <th className="px-3 py-2 font-semibold w-[260px]">Progress</th>
                  <th className="px-3 py-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ name: n, t, view, step }) => (
                  <tr key={n} className="border-t border-[var(--cpm-border)] align-middle">
                    <td className="px-4 py-2.5">
                      <Link
                        href="/training"
                        title="Open training file"
                        onClick={() => {
                          try {
                            localStorage.setItem("cpm_trainingSelected", JSON.stringify(n));
                            localStorage.setItem("cpm_trainingTab", JSON.stringify("trainees"));
                          } catch {}
                        }}
                        className="font-semibold text-[var(--cpm-text)] hover:text-[var(--cpm-accent)] hover:underline"
                      >
                        {n}
                      </Link>
                      <div className="text-[11px] text-[var(--cpm-text-faint)]">{t.team ? TEAM_LABEL[t.team] : "No team"}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                        style={{ color: VIEW[view].color, borderColor: VIEW[view].color, background: `${VIEW[view].color}1f` }}
                      >
                        {VIEW[view].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--cpm-text-dim)] whitespace-nowrap">{formatDay(t.start)}</td>
                    <td className="px-3 py-2.5">
                      <Progress t={t} view={view} step={step} hires={hires[n] ?? 0} today={today} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {view === "training" && (
                          <>
                            <button type="button" className={btnMain} onClick={() => updateTrainee(n, { stage: "qc", qcStart: today })}>
                              Training done → Start QC
                            </button>
                            <button type="button" className={btnGhost} onClick={() => updateTrainee(n, { stage: "dropped", droppedAt: today })}>
                              Drop
                            </button>
                          </>
                        )}
                        {view === "qc" && (
                          <>
                            <button type="button" className={btnMain} onClick={() => approve(n)}>
                              Approve → Add to recruiters
                            </button>
                            <button type="button" className={btnGhost} onClick={() => updateTrainee(n, { stage: "training", qcStart: undefined })}>
                              Back to training
                            </button>
                            <button type="button" className={btnGhost} onClick={() => updateTrainee(n, { stage: "dropped", droppedAt: today })}>
                              Drop
                            </button>
                          </>
                        )}
                        {view === "approved" && (
                          <button type="button" className={btnMain} onClick={() => updateTrainee(n, { firstHireAt: today })}>
                            Mark first hire
                          </button>
                        )}
                        {view === "dropped" && (
                          <>
                            <button type="button" className={btnGhost} onClick={() => updateTrainee(n, { stage: t.qcStart ? "qc" : "training", droppedAt: undefined })}>
                              Restore
                            </button>
                            <button
                              type="button"
                              className={`${btn} border-[var(--cpm-red)] text-[#ff9a9d] hover:bg-[var(--cpm-red)] hover:text-white`}
                              onClick={() => confirm(`Delete ${n} from the list for good?`) && removeTrainee(n)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-[12.5px] text-[var(--cpm-text-faint)]">
            {all.length ? "Nobody matches these filters." : "No new recruiters yet. Add one above to start their training."}
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({
  t,
  view,
  step,
  hires,
  today,
}: {
  t: Trainee;
  view: View;
  step: ReturnType<typeof stepStatus>;
  hires: number;
  today: string;
}) {
  if (step) {
    const color = step.late ? "#e5484d" : view === "qc" ? VIEW.qc.color : VIEW.training.color;
    return (
      <div>
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: step.days }, (_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < step.day ? color : "var(--cpm-border-strong)" }} />
          ))}
        </div>
        <div className="text-[11.5px]" style={{ color: step.late ? "#ff8a8e" : "var(--cpm-text-dim)" }}>
          {step.notStarted
            ? `Starts ${formatDay(view === "qc" ? t.qcStart : t.start)}`
            : step.late
              ? `${step.late} ${step.late === 1 ? "day" : "days"} late · was due ${formatDay(step.due)}`
              : `Day ${step.day} of ${step.days} · due ${formatDay(step.due)}`}
          <span className="text-[var(--cpm-text-faint)]"> · checklist {programProgress(t, view === "qc" ? "qc" : "training").pct}%</span>
        </div>
      </div>
    );
  }
  if (view === "approved") {
    const days = t.approvedAt ? workDaysBetween(t.approvedAt, today) : 0;
    return (
      <div className="text-[11.5px] text-[var(--cpm-text-dim)]">
        Approved {formatDay(t.approvedAt)} · {days} working {days === 1 ? "day" : "days"} · {hires} {hires === 1 ? "hire" : "hires"}
      </div>
    );
  }
  if (view === "graduated") return <div className="text-[11.5px] text-[var(--cpm-text-dim)]">First hire {formatDay(t.firstHireAt)}</div>;
  return <div className="text-[11.5px] text-[var(--cpm-text-faint)]">Dropped {formatDay(t.droppedAt)}</div>;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">{label}</div>
      <div className="text-[24px] font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Step({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {text}
    </span>
  );
}
