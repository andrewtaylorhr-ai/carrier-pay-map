// The training program the manager ticks off for each new recruiter on the
// Training page. Training items happen in the 3 training days; QC items in
// the 3 quality-control days while the manager listens to their calls.
import type { Trainee } from "@/lib/trainees";

export type ProgramItem = { id: string; text: string; hint?: string };
export type ProgramSection = { title: string; stage: "training" | "qc"; items: ProgramItem[] };

export const QUIZ_PASS = 80;
export const QC_GOOD_CALLS = 3; // good calls needed before approval

export const TRAINING_PROGRAM: ProgramSection[] = [
  {
    title: "Training day 1 · Set up",
    stage: "training",
    items: [
      { id: "d1-access", text: "Login, phone line and email are working" },
      { id: "d1-name", text: "Added to the Recruiters list with their team", hint: "Done on Team Overview." },
      { id: "d1-basics", text: "Went through Recruiting basics with them (words, call steps, script)" },
      { id: "d1-sheets", text: "Went through every carrier cheat sheet" },
    ],
  },
  {
    title: "Training day 2 · Tools",
    stage: "training",
    items: [
      { id: "d2-paymap", text: "Can find 3 accounts in their states on the Pay Map", hint: "Pay, home time and experience for each." },
      { id: "d2-plan", text: "Knows their states, carriers and accounts from the Strategy Plan" },
      { id: "d2-tracker", text: "Knows how to log submissions in the Daily Tracker" },
      { id: "d2-listen", text: "Listened to at least 5 calls from an experienced recruiter" },
    ],
  },
  {
    title: "Training day 3 · Practice",
    stage: "training",
    items: [
      { id: "d3-roleplay", text: "Did 3 role-play calls with the script" },
      { id: "d3-faq", text: "Can answer the driver questions in the FAQ" },
      { id: "d3-quiz", text: `Passed the quiz with ${QUIZ_PASS}% or more`, hint: "Ticks itself when you save a passing score." },
    ],
  },
  {
    title: "Quality control · On the calls",
    stage: "qc",
    items: [
      { id: "qc-calls", text: "Makes real calls to drivers in their states", hint: "Log each call you listen to below." },
      { id: "qc-submit", text: "Submitted a qualified driver to the right account" },
      { id: "qc-log", text: "Logs every submission in the Daily Tracker the same day" },
      { id: "qc-follow", text: "Calls back submitted drivers within 24 hours" },
      { id: "qc-review", text: "Final review done, ready to approve" },
    ],
  },
];

const itemsOf = (stage?: "training" | "qc") =>
  TRAINING_PROGRAM.filter((s) => !stage || s.stage === stage).flatMap((s) => s.items.map((i) => i.id));

// Checklist ids done, with the quiz item following the saved score.
export function doneIds(t: Trainee): Set<string> {
  const done = new Set(t.checklist ?? []);
  if ((t.quizScore ?? 0) >= QUIZ_PASS) done.add("d3-quiz");
  else done.delete("d3-quiz");
  return done;
}

export function programProgress(t: Trainee, stage?: "training" | "qc") {
  const ids = itemsOf(stage);
  const done = doneIds(t);
  const n = ids.filter((id) => done.has(id)).length;
  return { done: n, total: ids.length, pct: ids.length ? Math.round((n / ids.length) * 100) : 0 };
}

export const goodCalls = (t: Trainee) => (t.calls ?? []).filter((c) => c.good).length;
