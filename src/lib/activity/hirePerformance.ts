// Parses the recruiter "Performance" workbook — a flat, headerless log of
// every Hired driver, one row per driver, with a free-text follow-up Note
// column that gets appended to over time ("No dispatch yet 4/6 Good to
// invoice 4/7"). Unlike the Carrier Activity model (DriverRecord), this
// file only ever contains Hired rows — there's no Active/DQ signal here.
// The real question this answers isn't "were they hired" (they all were),
// it's "did the hire actually stick" — that's read out of the note text,
// not a status column, since this source has none.
import * as XLSX from "xlsx";
import { parseDateValue, titleCaseName } from "./parseWorkbook";

export type HireOutcome = "confirmed" | "pending" | "reversed";

export interface HirePerformanceRecord {
  id: string;
  name: string;
  recruiter: string;
  carrier: string;
  account: string;
  state: string;
  experience: string;
  /** YYYY-MM-DD — when the driver was submitted (column A). */
  submittedDate?: string;
  /** YYYY-MM-DD — when the driver was marked Hired (column K). */
  hiredDate?: string;
  note: string;
  outcome: HireOutcome;
  importedAt: string;
  sourceFile: string;
}

// The carrier column arrives with real typo/casing/spacing drift ("Swift ",
// "SWIFT", "Pam", "M.A.S.T", "Day & Ross") — collapse known variants to one
// canonical label per carrier so a recruiter's hires don't fragment across
// near-duplicate carrier buckets. Unrecognized values pass through cleaned
// up but unchanged, same "fix how it's typed, don't guess at merging"
// principle as normalizeAccount in parseWorkbook.ts.
const CARRIER_LABELS: [string, string][] = [
  ["cr england", "CR England"],
  ["us express", "US Express"],
  ["day & ross", "Day & Ross"],
  ["day&ross", "Day & Ross"],
  ["day and ross", "Day & Ross"],
  ["trans am", "Trans Am"],
  ["transam", "Trans Am"],
  ["transco", "Transco Lines"],
  ["m.a.s.t", "M.A.S.T"],
  ["mast", "M.A.S.T"],
  ["jb hunt", "JB Hunt"],
  ["hub group", "HUB Group"],
  ["ta dedicated", "TA Dedicated"],
  ["bay and bay", "Bay and Bay"],
  ["orozco", "Orozco Trucking"],
  ["swift", "Swift"],
  ["pam", "PAM"],
  ["usx", "USX"],
  ["nfi", "NFI"],
];

function normalizeCarrierLabel(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return "Unspecified";
  const hit = CARRIER_LABELS.find(([k]) => key === k || key.includes(k));
  return hit ? hit[1] : raw.trim().replace(/\s+/g, " ");
}

// --- Outcome classification ---------------------------------------------
// The note column is a running log, not a single status — later text
// overrides earlier text (it's literally the same recruiter/manager
// appending updates as reality changes). Verified against this exact file:
// every "invoice" mention in it is positive ("good to invoice", "set to
// invoice", 0 negated occurrences), and "not hired"/"coded not hired" is
// the only real reversal language found (3 rows) — so those two checks are
// safe as unconditional positive/negative signals. "dispatch" needs care:
// "no dispatch"/"not dispatched" must not be misread as the positive
// "dispatched" signal, including in rows where both appear ("no dispatch
// yet 9/15 dispatched 9/15" — a later, separate, unnegated mention) — the
// strip-then-recheck below handles that by removing every negated
// occurrence first and only then checking what's left for a bare
// "dispatched".
//
// No note, or a note with no tracking language at all, defaults to
// "confirmed" — this source only ever contains Hired drivers (there's no
// Active/DQ status here), so absent an explicit negative signal ("not
// hired") or an explicit stuck signal ("no dispatch yet"), there's nothing
// to indicate the hire didn't stick.
export function classifyHireOutcome(note: string): HireOutcome {
  const text = note.trim();
  if (!text) return "confirmed";
  if (/not hired/i.test(text)) return "reversed";
  if (/invoice/i.test(text)) return "confirmed";
  const stripped = text.replace(/\b(no|not)\s+(yet\s+)?dispatch(ed)?\b/gi, "");
  if (/\bdispatched\b/i.test(stripped)) return "confirmed";
  if (/\b(no|not)\s+(yet\s+)?dispatch(ed)?\b/i.test(text)) return "pending";
  return "confirmed";
}

// --- Parsing ---------------------------------------------------------------
// No header row — columns are fixed by position (verified against the real
// file): A submitted date, B driver name, C recruiter first name, D
// carrier, E team/lead, F account/lane, G city/zip, H state, I experience,
// J status (always "Hired" in this source), K hired-confirmed date, L note.
export function parseHirePerformanceWorkbook(buffer: ArrayBuffer, sourceFile: string): HirePerformanceRecord[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const importedAt = new Date().toISOString();
  const records: HirePerformanceRecord[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

    rows.forEach((row, i) => {
      const name = String(row[1] ?? "").trim();
      const recruiter = String(row[2] ?? "").trim();
      if (!name || !recruiter) return; // skip blank rows and rows we can't attribute to anyone

      const carrier = normalizeCarrierLabel(String(row[3] ?? ""));
      const account = String(row[5] ?? "").trim();
      const state = String(row[7] ?? "").trim().toUpperCase();
      const experience = String(row[8] ?? "").trim();
      const note = String(row[11] ?? "").trim();

      records.push({
        id: `${sourceFile}__${sheetName}__${i}`,
        name: titleCaseName(name),
        // Not run through titleCaseName — recruiter names in this source
        // are already properly cased (unlike driver names), and some are
        // bare initials ("AW"), which titleCaseName would mangle to "Aw".
        recruiter: recruiter.replace(/\s+/g, " ").trim(),
        carrier,
        account,
        state,
        experience,
        submittedDate: parseDateValue(row[0]),
        hiredDate: parseDateValue(row[10]),
        note,
        outcome: classifyHireOutcome(note),
        importedAt,
        sourceFile,
      });
    });
  }

  return records;
}

// --- Per-recruiter rollup ---------------------------------------------------

// Shared by recruiterHireRanked and hireTrendByMonth — anchored to the most
// recent record date IN THE FILE, not wall-clock "today" (see
// recruiterHireRanked for why). Rows with no date at all are kept rather
// than dropped.
function inWindow(records: HirePerformanceRecord[], sinceMonths: number): HirePerformanceRecord[] {
  const allDates = records
    .map((r) => r.hiredDate ?? r.submittedDate)
    .filter((d): d is string => !!d)
    .sort();
  const latest = allDates.length > 0 ? allDates[allDates.length - 1] : null;
  const cutoff = latest ? new Date(latest) : new Date();
  cutoff.setMonth(cutoff.getMonth() - sinceMonths);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return records.filter((r) => {
    const d = r.hiredDate ?? r.submittedDate;
    return !d || d >= cutoffIso;
  });
}

export interface HireIssue {
  name: string;
  recruiter: string;
  carrier: string;
  note: string;
  outcome: "pending" | "reversed";
  /** hiredDate ?? submittedDate — for sorting a cross-recruiter "most recent" list. */
  date?: string;
}

export interface RecruiterHireRow {
  recruiter: string;
  total: number;
  confirmed: number;
  pending: number;
  reversed: number;
  carriers: string[];
  /** The carrier this recruiter has placed the most hires with. */
  topCarrier: string;
  /** The pending/reversed hires behind this recruiter's numbers, most concerning first — for "find the problem, then fix it". */
  issues: HireIssue[];
}

// Ranks recruiters by "needs a follow-up call" first (reversed hires, then
// stuck-pending hires), so a problem shows up at the top of the table
// instead of buried in a sea of clean rows — directly answers "who did not
// keep that performance". Confirmed/total is still shown per row so the
// same table doubles as "who's doing well".
//
// Window is anchored to the most recent record date IN THE FILE, not
// wall-clock "today" — these reports get generated and handed off some time
// after the period they cover, so anchoring to today would silently shrink
// or empty the window depending on when it's uploaded. Rows with no date at
// all are kept rather than dropped (this file's dates are dense, but a
// future upload isn't guaranteed to be).
export function recruiterHireRanked(records: HirePerformanceRecord[], sinceMonths = 6): RecruiterHireRow[] {
  const map = new Map<string, RecruiterHireRow>();
  // Tracked alongside `map` rather than on the row itself — it's an
  // implementation detail for deriving topCarrier, not part of the public shape.
  const carrierCounts = new Map<string, Map<string, number>>();
  inWindow(records, sinceMonths).forEach((r) => {
    if (!map.has(r.recruiter)) {
      map.set(r.recruiter, {
        recruiter: r.recruiter,
        total: 0,
        confirmed: 0,
        pending: 0,
        reversed: 0,
        carriers: [],
        topCarrier: "",
        issues: [],
      });
      carrierCounts.set(r.recruiter, new Map());
    }
    const row = map.get(r.recruiter)!;
    row.total += 1;
    row[r.outcome] += 1;
    if (!row.carriers.includes(r.carrier)) row.carriers.push(r.carrier);
    const counts = carrierCounts.get(r.recruiter)!;
    counts.set(r.carrier, (counts.get(r.carrier) ?? 0) + 1);
    if (r.outcome === "pending" || r.outcome === "reversed") {
      row.issues.push({
        name: r.name,
        recruiter: r.recruiter,
        carrier: r.carrier,
        note: r.note,
        outcome: r.outcome,
        date: r.hiredDate ?? r.submittedDate,
      });
    }
  });

  return Array.from(map.values())
    .map((row) => {
      const top = Array.from(carrierCounts.get(row.recruiter)!.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        ...row,
        topCarrier: top ? top[0] : "—",
        issues: row.issues.sort((a, b) => (a.outcome === b.outcome ? 0 : a.outcome === "reversed" ? -1 : 1)),
      };
    })
    .sort((a, b) => (b.reversed * 3 + b.pending) - (a.reversed * 3 + a.pending) || b.total - a.total);
}

// --- Carrier volume rollup (for the "carriers used" KPI + top-carrier insight) ---

export interface CarrierHireRow {
  carrier: string;
  total: number;
}

// Same window as recruiterHireRanked, but rolled up by carrier instead of
// recruiter — independent of any one recruiter's breakdown.
export function carrierHireRanked(records: HirePerformanceRecord[], sinceMonths = 6): CarrierHireRow[] {
  const map = new Map<string, number>();
  inWindow(records, sinceMonths).forEach((r) => {
    map.set(r.carrier, (map.get(r.carrier) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([carrier, total]) => ({ carrier, total }))
    .sort((a, b) => b.total - a.total);
}

// --- Monthly outcome trend (for the "hires over time" chart) ---------------

export interface MonthlyOutcomeRow {
  /** YYYY-MM */
  month: string;
  confirmed: number;
  pending: number;
  reversed: number;
}

// Same window as recruiterHireRanked, bucketed by month. Records with no
// date can't be placed on a timeline and are excluded here (they're still
// counted everywhere else — this chart alone undercounts by that amount).
export function hireTrendByMonth(records: HirePerformanceRecord[], sinceMonths = 6): MonthlyOutcomeRow[] {
  const map = new Map<string, MonthlyOutcomeRow>();
  inWindow(records, sinceMonths).forEach((r) => {
    const d = r.hiredDate ?? r.submittedDate;
    if (!d) return;
    const month = d.slice(0, 7);
    if (!map.has(month)) map.set(month, { month, confirmed: 0, pending: 0, reversed: 0 });
    map.get(month)![r.outcome] += 1;
  });
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
