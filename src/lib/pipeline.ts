// Driver Pipeline: the drivers our team submits, their follow-ups and DQP
// schedules, read from the no-reply@classarecruitinginc.com emails.
//
// A Google Apps Script in the manager's Gmail (pipeline-script.ts) reads the
// emails every 10 minutes and saves them to the shared key PIPELINE_INBOX_KEY.
// Only that script writes it; the app only reads it. What the app's users
// change here (recruiter names, removed emails) lives in PIPELINE_KEY.
// Driver phone numbers and emails are never saved.

export const PIPELINE_INBOX_KEY = "cdlPayMapPipelineInbox";
export const PIPELINE_KEY = "cdlPayMapPipeline";
export const PIPELINE_SENDER = "no-reply@classarecruitinginc.com";
// Every email's day is counted in US Central time, so the whole team counts
// the same day whatever their own time zone.
export const PIPELINE_TZ = "America/Chicago";

export type PipelineEventType = "submission" | "followup" | "dqp";

export interface PipelineEvent {
  id: string; // Gmail message id
  type: PipelineEventType;
  at: string; // ISO time the email arrived
  driver?: string; // submissions: the Name field
  carrier?: string;
  recruiter?: string; // as written in the email
  message?: string; // Recruiter Message, or the start of a follow-up / DQP email
  subject?: string;
}

export interface PipelineInbox {
  events: PipelineEvent[];
  updatedAt?: string; // last time the script saved
}

export interface PipelineSettings {
  aliases: Record<string, string>; // recruiter name in the emails -> roster name ("" = not ours)
  hidden?: string[]; // ids of emails removed from the pipeline
}

export const EMPTY_INBOX: PipelineInbox = { events: [] };
export const EMPTY_PIPELINE: PipelineSettings = { aliases: {} };

// Phone numbers, emails and SSNs are taken out of any text we show or save.
export function maskPrivate(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[removed]")
    .replace(/(\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, "[phone]");
}

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: PIPELINE_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
// "YYYY-MM-DD" in US Central time
export const dayOf = (iso: string) => dayFmt.format(new Date(iso));
export const todayDay = () => dayFmt.format(new Date());

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// The roster name for a recruiter name written in an email: a name picked by
// the user, else the same name, else a unique first-name match.
export function rosterName(emailName: string | undefined, roster: string[], aliases: Record<string, string>): string | null {
  if (!emailName) return null;
  const key = emailName.trim();
  if (key in aliases) return aliases[key] || null;
  const n = norm(key);
  const same = roster.find((r) => norm(r) === n);
  if (same) return same;
  const first = n.split(" ")[0];
  const byFirst = roster.filter((r) => norm(r).split(" ")[0] === first);
  return byFirst.length === 1 ? byFirst[0] : null;
}

export interface Touch {
  id: string;
  at: string;
  text: string;
}

export interface PipelineDriver {
  key: string;
  id: string; // the submission email's id
  name: string;
  carrier: string;
  recruiter: string | null; // roster name
  emailRecruiter: string; // as written in the email
  at: string; // submitted
  message: string;
  followups: Touch[];
  dqp: Touch[];
}

export interface Pipeline {
  drivers: PipelineDriver[]; // newest first
  unmatchedFollowups: PipelineEvent[];
  unmatchedDqp: PipelineEvent[];
  emailRecruiters: { name: string; count: number; roster: string | null }[];
}

// Drivers from the submission emails, with each follow-up and DQP email
// matched to the driver whose full name it mentions (the latest one submitted
// before it, if the name was submitted more than once).
export function buildPipeline(inbox: PipelineInbox, settings: PipelineSettings, roster: string[]): Pipeline {
  const hidden = new Set(settings.hidden ?? []);
  const events = inbox.events.filter((e) => !hidden.has(e.id)).sort((a, b) => a.at.localeCompare(b.at));
  const drivers: PipelineDriver[] = [];
  const byName = new Map<string, PipelineDriver[]>();
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "submission" || !e.driver) continue;
    const name = e.driver.trim();
    const d: PipelineDriver = {
      key: e.id,
      id: e.id,
      name,
      carrier: e.carrier?.trim() ?? "",
      recruiter: rosterName(e.recruiter, roster, settings.aliases),
      emailRecruiter: e.recruiter?.trim() ?? "",
      at: e.at,
      message: maskPrivate(e.message ?? ""),
      followups: [],
      dqp: [],
    };
    drivers.push(d);
    const n = norm(name);
    if (n.includes(" ") || n.length >= 4) byName.set(n, [...(byName.get(n) ?? []), d]);
    if (d.emailRecruiter) counts.set(d.emailRecruiter, (counts.get(d.emailRecruiter) ?? 0) + 1);
  }
  // longest names first, so "Mike Allen Jr" wins over "Mike Allen"
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  const match = (e: PipelineEvent) => {
    const text = ` ${norm(`${e.subject ?? ""} ${e.driver ?? ""} ${e.message ?? ""}`)} `;
    const n = names.find((x) => text.includes(` ${x} `));
    if (!n) return null;
    const list = byName.get(n)!;
    return [...list].reverse().find((d) => d.at <= e.at) ?? list[0];
  };
  const unmatchedFollowups: PipelineEvent[] = [];
  const unmatchedDqp: PipelineEvent[] = [];
  for (const e of events) {
    if (e.type === "submission") continue;
    const d = match(e);
    const touch = { id: e.id, at: e.at, text: maskPrivate(e.message || e.subject || "") };
    if (e.type === "followup") (d ? d.followups.push(touch) : unmatchedFollowups.push(e));
    else (d ? d.dqp.push(touch) : unmatchedDqp.push(e));
  }
  const emailRecruiters = [...counts.entries()]
    .map(([name, count]) => ({ name, count, roster: rosterName(name, roster, settings.aliases) }))
    .sort((a, b) => Number(!!a.roster) - Number(!!b.roster) || b.count - a.count);
  return { drivers: drivers.reverse(), unmatchedFollowups: unmatchedFollowups.reverse(), unmatchedDqp: unmatchedDqp.reverse(), emailRecruiters };
}

// Submissions per roster recruiter per day of the month, for the Daily Tracker.
export function submissionsByDay(p: Pipeline, ym: string): Record<string, Record<number, number>> {
  const out: Record<string, Record<number, number>> = {};
  for (const d of p.drivers) {
    if (!d.recruiter) continue;
    const day = dayOf(d.at);
    if (!day.startsWith(ym)) continue;
    const n = Number(day.slice(8));
    const row = (out[d.recruiter] ??= {});
    row[n] = (row[n] ?? 0) + 1;
  }
  return out;
}
