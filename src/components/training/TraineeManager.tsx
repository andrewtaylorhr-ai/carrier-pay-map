"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { RecruiterTeam } from "@/lib/carriers/types";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { TEST_PASS } from "@/lib/academy-test";
import { ACADEMY_URL, PRACTICE, QC_GOOD_CALLS, READY_CHECK, goodCalls, programProgress, type PlanItem } from "@/lib/training-program";
import { AcademyList } from "./AcademyList";
import { NEW_RECRUITER_COLOR, type Trainee, formatDay, stepStatus, todayISO } from "@/lib/trainees";

const STAGE: Record<Trainee["stage"], { label: string; color: string }> = {
  training: { label: "Training", color: "#f59e0b" },
  qc: { label: "Quality control", color: "#a855f7" },
  approved: { label: "Approved", color: NEW_RECRUITER_COLOR },
  dropped: { label: "Dropped", color: "#9aa0ad" },
};
const TEAM_LABEL: Record<RecruiterTeam, string> = { uzbek: "Uzbek", philippines: "Philippines" };

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const btn = "h-7 px-2.5 rounded-md text-[11.5px] font-semibold border transition-colors whitespace-nowrap";
const btnMain = `${btn} border-[var(--cpm-accent)] bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)]`;
const btnGhost = `${btn} border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]`;
const input =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

function StagePill({ stage }: { stage: Trainee["stage"] }) {
  const s = STAGE[stage];
  return (
    <span className="text-[10.5px] font-semibold px-2 py-px rounded-full border whitespace-nowrap" style={{ color: s.color, borderColor: s.color, background: `${s.color}1f` }}>
      {s.label}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] overflow-hidden">
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const stepText = (t: Trainee, today: string) => {
  const s = stepStatus(t, today);
  if (!s) return t.stage === "approved" ? `Approved ${formatDay(t.approvedAt)}` : `Dropped ${formatDay(t.droppedAt)}`;
  if (s.notStarted) return `Starts ${formatDay(t.stage === "qc" ? t.qcStart : t.start)}`;
  if (s.late) return `${s.late} ${s.late === 1 ? "day" : "days"} late · was due ${formatDay(s.due)}`;
  return `Day ${s.day} of ${s.days} · due ${formatDay(s.due)}`;
};

// The manager's side of training: pick a new recruiter, tick off the Academy
// lessons (day 1), run the Academy test, tick off practice (days 2–3), log the
// calls you listened to in QC, then move them on.
export function TraineeManager({ onRunTest }: { onRunTest: (name: string) => void }) {
  const { trainees, updateTrainee, approveTrainee } = useCarrierMap();
  const today = todayISO();
  const [selected, setSelected] = useLocalStorageState<string>("cpm_trainingSelected", "");
  const [showAll, setShowAll] = useState(false);

  const people = Object.entries(trainees)
    .filter(([, t]) => showAll || t.stage === "training" || t.stage === "qc")
    .sort(([a, x], [b, y]) => (x.stage === y.stage ? 0 : x.stage === "training" ? -1 : y.stage === "training" ? 1 : 0) || x.start.localeCompare(y.start) || a.localeCompare(b));
  const current = people.find(([n]) => n === selected) ?? people[0];

  if (!Object.keys(trainees).length) {
    return (
      <div className={`${card} px-4 py-8 text-center text-[13px] text-[var(--cpm-text-dim)]`}>
        Nobody in training yet. Add new recruiters on the{" "}
        <Link href="/controller" className="text-[var(--cpm-accent)] font-semibold hover:underline">
          Controller
        </Link>{" "}
        page, then manage their training here.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[290px_1fr] items-start">
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--cpm-border)]">
          <span className="text-[13px] font-bold text-[var(--cpm-text)]">Trainees</span>
          <button type="button" onClick={() => setShowAll((v) => !v)} className="ml-auto text-[11.5px] text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)] hover:underline">
            {showAll ? "Only in training & QC" : `Show everyone (${Object.keys(trainees).length})`}
          </button>
        </div>
        {people.length ? (
          <ul>
            {people.map(([n, t]) => {
              const s = stepStatus(t, today);
              const p = programProgress(t);
              const active = current?.[0] === n;
              return (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => setSelected(n)}
                    className={`w-full text-left px-3 py-2.5 border-b border-[var(--cpm-border)] transition-colors ${
                      active ? "bg-[var(--cpm-panel-alt)] shadow-[inset_3px_0_0_var(--cpm-accent)]" : "hover:bg-[var(--cpm-panel-alt)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-[var(--cpm-text)] truncate">{n}</span>
                      <span className="ml-auto">
                        <StagePill stage={t.stage} />
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5 mb-1.5" style={{ color: s?.late ? "#ff8a8e" : "var(--cpm-text-faint)" }}>
                      {stepText(t, today)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Bar pct={p.pct} color="var(--cpm-green)" />
                      </div>
                      <span className="text-[10.5px] tabular-nums text-[var(--cpm-text-faint)]">
                        {p.done}/{p.total}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-3 py-6 text-[12px] text-center text-[var(--cpm-text-faint)]">Nobody is in training or QC right now.</div>
        )}
        <div className="px-3 py-2 text-[11px] text-[var(--cpm-text-faint)]">
          Add people on the{" "}
          <Link href="/controller" className="text-[var(--cpm-accent)] hover:underline">
            Controller
          </Link>
          .
        </div>
      </div>

      {current ? (
        <TraineeFile
          key={current[0]}
          name={current[0]}
          t={current[1]}
          today={today}
          update={(patch) => updateTrainee(current[0], patch)}
          approve={() => {
            const problem = approveTrainee(current[0]);
            if (problem) alert(problem);
          }}
          onRunTest={() => onRunTest(current[0])}
        />
      ) : (
        <div className={`${card} px-4 py-8 text-center text-[12.5px] text-[var(--cpm-text-faint)]`}>Pick someone on the left.</div>
      )}
    </div>
  );
}

function TraineeFile({
  name,
  t,
  today,
  update,
  approve,
  onRunTest,
}: {
  name: string;
  t: Trainee;
  today: string;
  update: (patch: Partial<Trainee>) => void;
  approve: () => void;
  onRunTest: () => void;
}) {
  const done = new Set(t.checklist ?? []);
  const p = programProgress(t);
  const good = goodCalls(t);
  const s = stepStatus(t, today);
  const testPassed = (t.testScore ?? 0) >= TEST_PASS;
  // The Academy is day 1: from day 2 on, unfinished lessons are flagged.
  const academyLate = t.stage === "training" && !!s && !s.notStarted && (s.day >= 2 || s.late > 0) && p.done < p.total;
  const practiceDone = PRACTICE.filter((i) => done.has(i.id)).length;
  const [callDate, setCallDate] = useState(today);
  const [callGood, setCallGood] = useState(true);
  const [callNote, setCallNote] = useState("");

  const toggle = (id: string) => {
    const list = t.checklist ?? [];
    update({ checklist: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  };
  const addCall = () => {
    update({ calls: [...(t.calls ?? []), { date: callDate || today, good: callGood, note: callNote.trim() || undefined }] });
    setCallNote("");
    setCallGood(true);
  };

  const startQc = () => {
    const left = p.total - p.done;
    const missing = [
      left && `${left} Academy ${left === 1 ? "lesson" : "lessons"} not ticked`,
      !testPassed && (t.testScore == null ? "the Academy test isn't taken" : `the Academy test isn't passed (${t.testScore}%)`),
      !done.has(READY_CHECK.id) && `the "Ready for calls" check isn't ticked`,
    ].filter(Boolean);
    if (missing.length && !confirm(`${name}: ${missing.join(", ")}. Start quality control anyway?`)) return;
    update({ stage: "qc", qcStart: today });
  };
  const doApprove = () => {
    const missing = [
      p.done < p.total && `${p.total - p.done} Academy ${p.total - p.done === 1 ? "lesson" : "lessons"} not ticked`,
      good < QC_GOOD_CALLS && `only ${good} of ${QC_GOOD_CALLS} good calls logged`,
    ].filter(Boolean);
    if (missing.length && !confirm(`${name}: ${missing.join(", ")}. Approve anyway?`)) return;
    approve();
  };

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className={`${card} px-4 py-3 flex items-center gap-3 flex-wrap`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[var(--cpm-text)]">{name}</span>
            <StagePill stage={t.stage} />
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: s?.late ? "#ff8a8e" : "var(--cpm-text-faint)" }}>
            {t.team ? TEAM_LABEL[t.team] : "No team"} · started {formatDay(t.start)} · {stepText(t, today)}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
          {t.stage === "training" && (
            <>
              <button type="button" className={btnMain} onClick={startQc}>
                Training done → Start QC
              </button>
              <button type="button" className={btnGhost} onClick={() => update({ stage: "dropped", droppedAt: today })}>
                Drop
              </button>
            </>
          )}
          {t.stage === "qc" && (
            <>
              <button type="button" className={btnMain} onClick={doApprove}>
                Approve → Add to recruiters
              </button>
              <button type="button" className={btnGhost} onClick={() => update({ stage: "training", qcStart: undefined })}>
                Back to training
              </button>
              <button type="button" className={btnGhost} onClick={() => update({ stage: "dropped", droppedAt: today })}>
                Drop
              </button>
            </>
          )}
          {t.stage === "dropped" && (
            <button type="button" className={btnGhost} onClick={() => update({ stage: t.qcStart ? "qc" : "training", droppedAt: undefined })}>
              Restore
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <Mini label="Academy lessons" value={`${p.done}/${p.total}`} pct={p.pct} color="#f59e0b" />
        <Mini
          label="Academy test"
          value={t.testScore != null ? `${t.testScore}%` : "Not taken"}
          pct={t.testScore ?? 0}
          color={testPassed ? "var(--cpm-green)" : "#e5484d"}
        />
        <Mini label="Good QC calls" value={`${good}/${QC_GOOD_CALLS}`} pct={Math.min(100, (good / QC_GOOD_CALLS) * 100)} color="var(--cpm-green)" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Step 1 · Academy (day 1)</h3>
        <span className="text-[11.5px] text-[var(--cpm-text-faint)]">The whole Academy is done on the first day. Tick each lesson as it&apos;s finished.</span>
        <a href={ACADEMY_URL} target="_blank" rel="noreferrer" className="ml-auto text-[11.5px] text-[var(--cpm-accent)] hover:underline">
          Open the Academy in Notion
        </a>
      </div>
      {academyLate && (
        <div className="rounded-lg border border-[#e5484d] bg-[var(--cpm-red-soft)] px-3 py-2 text-[12.5px] text-[#ff9a9d]">
          The Academy should be finished on day 1. {p.total - p.done} {p.total - p.done === 1 ? "lesson is" : "lessons are"} still not done.
        </div>
      )}
      <AcademyList done={done} onToggle={toggle} />

      <section className={`${card} px-4 py-3 flex items-center gap-3 flex-wrap`}>
        <div>
          <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Step 2 · Academy test</h3>
          <div className="text-[12px] text-[var(--cpm-text-faint)]">
            Questions from the Academy lessons, pass with {TEST_PASS}%.{" "}
            {t.testScore == null ? "Not taken yet." : testPassed ? `Passed with ${t.testScore}%.` : `Best so far ${t.testScore}%, not passed yet.`}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className={btnMain} onClick={onRunTest}>
            {t.testScore == null ? "Start the test" : "Take the test again"} with {name.split(" ")[0]}
          </button>
          {t.testScore != null && (
            <button type="button" className={btnGhost} onClick={() => confirm("Clear the test score?") && update({ testScore: undefined })}>
              Clear score
            </button>
          )}
        </div>
      </section>

      <section className={card}>
        <h3 className="flex items-center px-4 py-2.5 border-b border-[var(--cpm-border)] text-[14px] font-bold text-[var(--cpm-text)]">
          Step 3 · Days 2–3 · Practice
          <span className={`ml-auto text-[11.5px] font-semibold ${practiceDone === PRACTICE.length ? "text-[var(--cpm-green)]" : "text-[var(--cpm-text-faint)]"}`}>
            {practiceDone}/{PRACTICE.length}
          </span>
        </h3>
        <ul className="px-2 py-2">
          {PRACTICE.map((i) => (
            <TickRow key={i.id} item={i} checked={done.has(i.id)} onToggle={() => toggle(i.id)} />
          ))}
          <TickRow item={READY_CHECK} checked={done.has(READY_CHECK.id)} onToggle={() => toggle(READY_CHECK.id)} strong />
        </ul>
      </section>

      <section className={`${card} px-4 py-3`}>
        <h3 className="text-[13.5px] font-bold text-[var(--cpm-text)] mb-1">Notes</h3>
        <textarea
          value={t.note ?? ""}
          onChange={(e) => update({ note: e.target.value || undefined })}
          placeholder="Strengths, things to work on, anything to remember…"
          className="w-full min-h-[64px] px-2.5 py-2 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)] resize-y"
        />
      </section>

      <section className={card}>
        <div className="flex items-center px-4 py-2.5 border-b border-[var(--cpm-border)]">
          <h3 className="text-[13.5px] font-bold text-[var(--cpm-text)]">Quality control calls</h3>
          <span className="ml-auto text-[11.5px] text-[var(--cpm-text-faint)]">
            Listen to their calls and log each one. {QC_GOOD_CALLS} good calls before approval.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-[var(--cpm-border)]">
          <input type="date" className={input} value={callDate} onChange={(e) => setCallDate(e.target.value)} aria-label="Call date" />
          <div className="segTabs">
            <button type="button" className={callGood ? "active" : undefined} onClick={() => setCallGood(true)}>
              <Check size={13} /> Good
            </button>
            <button type="button" className={!callGood ? "active" : undefined} onClick={() => setCallGood(false)}>
              <X size={13} /> Needs work
            </button>
          </div>
          <input
            className={`${input} flex-1 min-w-[180px]`}
            placeholder="What went well / what to fix"
            value={callNote}
            onChange={(e) => setCallNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCall()}
          />
          <button type="button" className={btnMain} onClick={addCall}>
            + Log call
          </button>
        </div>
        {(t.calls ?? []).length ? (
          <ul>
            {[...(t.calls ?? [])]
              .map((c, i) => ({ c, i }))
              .sort((a, b) => b.c.date.localeCompare(a.c.date) || b.i - a.i)
              .map(({ c, i }) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2 border-b border-[var(--cpm-border)] last:border-b-0 text-[12.5px]">
                  <span className="text-[var(--cpm-text-faint)] w-[52px] shrink-0">{formatDay(c.date)}</span>
                  <span className={`font-semibold w-[90px] shrink-0 ${c.good ? "text-[var(--cpm-green)]" : "text-[#ff9a9d]"}`}>{c.good ? "Good" : "Needs work"}</span>
                  <span className="text-[var(--cpm-text-dim)] flex-1 min-w-0">{c.note ?? ""}</span>
                  <button
                    type="button"
                    title="Remove call"
                    onClick={() => update({ calls: (t.calls ?? []).filter((_, j) => j !== i) })}
                    className="text-[var(--cpm-text-faint)] hover:text-[#ff9a9d]"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <div className="px-4 py-4 text-[12px] text-[var(--cpm-text-faint)]">No calls logged yet.</div>
        )}
      </section>
    </div>
  );
}

function TickRow({ item, checked, onToggle, strong }: { item: PlanItem; checked: boolean; onToggle: () => void; strong?: boolean }) {
  return (
    <li>
      <label className={`flex gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--cpm-panel-alt)] ${strong ? "bg-[var(--cpm-panel-alt)] mt-1" : ""}`}>
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5 accent-[var(--cpm-green)]" />
        <span className={`text-[12.5px] ${strong ? "font-semibold" : ""} ${checked ? "text-[var(--cpm-text-faint)] line-through" : "text-[var(--cpm-text)]"}`}>{item.title}</span>
      </label>
    </li>
  );
}

function Mini({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className={`${card} px-3 py-2.5`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">{label}</div>
      <div className="text-[18px] font-bold tabular-nums text-[var(--cpm-text)] mb-1.5">{value}</div>
      <Bar pct={pct} color={color} />
    </div>
  );
}
