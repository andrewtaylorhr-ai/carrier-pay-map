// New-recruiter pipeline for the Controller page:
// training (3 working days) -> quality control on calls (3 working days)
// -> approved (added to the recruiter roster, shown as "New" until their
// first hire) -> graduated. Working days are Mon–Sat, like the Daily Tracker.
import type { RecruiterTeam } from "@/lib/carriers/types";

export type TraineeStage = "training" | "qc" | "approved" | "dropped";

export interface Trainee {
  team: RecruiterTeam | null;
  start: string; // "YYYY-MM-DD", first training day
  stage: TraineeStage;
  qcStart?: string; // first quality-control day
  approvedAt?: string;
  firstHireAt?: string; // set once they hire their first driver
  droppedAt?: string;
  note?: string;
  // Filled in by the manager on the Training page.
  checklist?: string[]; // ids of Academy lessons and practice tasks done
  testScore?: number; // best Academy test %, out of 100
  calls?: QcCall[]; // calls listened to during quality control
}

export interface QcCall {
  date: string;
  good: boolean;
  note?: string;
}

export type PersistedTrainees = Record<string, Trainee>;

export const TRAINING_DAYS = 3;
export const QC_DAYS = 3;
export const NEW_RECRUITER_COLOR = "#0ea5e9";

const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const isWorkDay = (d: Date) => d.getDay() !== 0;

// Last day of a step that starts on `start` and lasts `days` working days.
export function dueDate(start: string, days: number): string {
  const d = parseISO(start);
  while (!isWorkDay(d)) d.setDate(d.getDate() + 1);
  let left = days - 1;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkDay(d)) left--;
  }
  return toISO(d);
}

// Working days from `from` to `to`, both included (0 if `to` is before `from`).
export function workDaysBetween(from: string, to: string): number {
  const d = parseISO(from);
  const end = parseISO(to);
  let n = 0;
  while (d <= end) {
    if (isWorkDay(d)) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

export const formatDay = (s?: string) =>
  s ? parseISO(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

// Where a trainee stands in their current timed step, as of `today`.
export function stepStatus(t: Trainee, today = todayISO()) {
  const timed = t.stage === "training" ? { from: t.start, days: TRAINING_DAYS } : t.stage === "qc" && t.qcStart ? { from: t.qcStart, days: QC_DAYS } : null;
  if (!timed) return null;
  const due = dueDate(timed.from, timed.days);
  const day = workDaysBetween(timed.from, today);
  const late = today > due ? workDaysBetween(due, today) - 1 : 0;
  return { due, day: Math.min(day, timed.days), days: timed.days, late, notStarted: today < timed.from };
}
