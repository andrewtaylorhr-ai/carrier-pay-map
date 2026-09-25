// Parses the recruiter "Performance" workbook — a flat, headerless log of
// every Hired driver, one row per driver. Unlike the Carrier Activity model
// (DriverRecord), this file only ever contains Hired rows — there's no
// Active/DQ/pending signal here and no attempt to read one out of the notes:
// every row in this source is a hire, full stop.
import * as XLSX from "xlsx";
import { parseDateValue, titleCaseName } from "./parseWorkbook";

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

// --- Parsing ---------------------------------------------------------------
// No header row — columns are fixed by position (verified against the real
// file): A submitted date, B driver name, C recruiter first name, D
// carrier, E team/lead, F account/lane, G city/zip, H state, I experience,
// J status (always "Hired" in this source), K hired-confirmed date, L note
// (free-text follow-up log — not read here, this source is treated as
// straight hire volume, not an outcome tracker).
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
        importedAt,
        sourceFile,
      });
    });
  }

  return records;
}

// --- Per-recruiter rollup ---------------------------------------------------

// Shared by recruiterHireRanked and hireTrendByMonth — anchored to the most
// recent record date IN THE FILE, not wall-clock "today". These reports get
// generated and handed off some time after the period they cover, so
// anchoring to today would silently shrink or empty the window depending on
// when it's uploaded. Rows with no date at all are kept rather than dropped.
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

export interface RecruiterHireDetail {
  name: string;
  carrier: string;
  account: string;
  /** YYYY-MM-DD, or null when the record has neither a hired nor submitted date. */
  date: string | null;
}

export interface RecruiterHireRow {
  recruiter: string;
  total: number;
  carriers: string[];
  /** The carrier this recruiter has placed the most hires with. */
  topCarrier: string;
  /** Every individual hire, most recent first (undated hires last). */
  hires: RecruiterHireDetail[];
}

// Ranked by volume, highest producer first — every row here is a hire, so
// there's no "worst-first" ranking left to do; volume is the whole story.
//
// Window is anchored to the most recent record date IN THE FILE, not
// wall-clock "today" — see inWindow(). Rows with no date at all are kept
// rather than dropped (this file's dates are dense, but a future upload
// isn't guaranteed to be).
export function recruiterHireRanked(records: HirePerformanceRecord[], sinceMonths = 6): RecruiterHireRow[] {
  const map = new Map<string, RecruiterHireRow>();
  // Tracked alongside `map` rather than on the row itself — it's an
  // implementation detail for deriving topCarrier, not part of the public shape.
  const carrierCounts = new Map<string, Map<string, number>>();
  inWindow(records, sinceMonths).forEach((r) => {
    if (!map.has(r.recruiter)) {
      map.set(r.recruiter, { recruiter: r.recruiter, total: 0, carriers: [], topCarrier: "", hires: [] });
      carrierCounts.set(r.recruiter, new Map());
    }
    const row = map.get(r.recruiter)!;
    row.total += 1;
    if (!row.carriers.includes(r.carrier)) row.carriers.push(r.carrier);
    row.hires.push({ name: r.name, carrier: r.carrier, account: r.account, date: r.hiredDate ?? r.submittedDate ?? null });
    const counts = carrierCounts.get(r.recruiter)!;
    counts.set(r.carrier, (counts.get(r.carrier) ?? 0) + 1);
  });

  return Array.from(map.values())
    .map((row) => {
      const top = Array.from(carrierCounts.get(row.recruiter)!.entries()).sort((a, b) => b[1] - a[1])[0];
      // Most recent hire first; hires with no date at all sort last.
      const hires = [...row.hires].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
      return { ...row, hires, topCarrier: top ? top[0] : "—" };
    })
    .sort((a, b) => b.total - a.total);
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

// --- Monthly hire volume (for the "hires over time" chart) ---------------

export interface MonthlyHireRow {
  /** YYYY-MM */
  month: string;
  total: number;
}

// Same window as recruiterHireRanked, bucketed by month. Records with no
// date can't be placed on a timeline and are excluded here (they're still
// counted everywhere else — this chart alone undercounts by that amount).
export function hireTrendByMonth(records: HirePerformanceRecord[], sinceMonths = 6): MonthlyHireRow[] {
  const map = new Map<string, number>();
  inWindow(records, sinceMonths).forEach((r) => {
    const d = r.hiredDate ?? r.submittedDate;
    if (!d) return;
    const month = d.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// --- Monthly hires by carrier (multi-line trend, one line per carrier) -----

export interface MonthlyCarrierTrend {
  /** YYYY-MM, ascending — same bucketing as hireTrendByMonth. */
  months: string[];
  /** One entry per carrier, counts aligned to `months`. Ranked by total
   *  volume, highest first. Carriers beyond MAX_CARRIER_LINES are rolled
   *  into a trailing "Other" series so a long tail of one-off carriers
   *  doesn't turn the chart into unreadable spaghetti. */
  series: { carrier: string; counts: number[] }[];
}

const MAX_CARRIER_LINES = 6;

// Same window/month-bucketing as hireTrendByMonth, split out per carrier
// instead of summed — this answers "which carrier" for that chart. Records
// with no date are excluded here for the same reason hireTrendByMonth
// excludes them: they can't be placed on a timeline.
export function monthlyHiresByCarrier(records: HirePerformanceRecord[], sinceMonths = 6): MonthlyCarrierTrend {
  const dated = inWindow(records, sinceMonths).filter((r) => r.hiredDate ?? r.submittedDate);
  const months = Array.from(new Set(dated.map((r) => (r.hiredDate ?? r.submittedDate)!.slice(0, 7)))).sort();
  const monthIndex = new Map(months.map((m, i) => [m, i]));

  const byCarrier = new Map<string, number[]>();
  const totals = new Map<string, number>();
  dated.forEach((r) => {
    const month = (r.hiredDate ?? r.submittedDate)!.slice(0, 7);
    if (!byCarrier.has(r.carrier)) byCarrier.set(r.carrier, new Array(months.length).fill(0));
    byCarrier.get(r.carrier)![monthIndex.get(month)!] += 1;
    totals.set(r.carrier, (totals.get(r.carrier) ?? 0) + 1);
  });

  const ranked = Array.from(byCarrier.entries()).sort((a, b) => (totals.get(b[0]) ?? 0) - (totals.get(a[0]) ?? 0));
  const head = ranked.slice(0, MAX_CARRIER_LINES);
  const tail = ranked.slice(MAX_CARRIER_LINES);

  const series = head.map(([carrier, counts]) => ({ carrier, counts }));
  if (tail.length > 0) {
    const otherCounts = new Array(months.length).fill(0);
    tail.forEach(([, counts]) => counts.forEach((c, i) => (otherCounts[i] += c)));
    series.push({ carrier: "Other", counts: otherCounts });
  }

  return { months, series };
}

// --- Monthly hires by recruiter (recruiter x month grid) -------------------

export interface MonthlyHireMatrix {
  /** YYYY-MM, ascending. Only months with at least one hire (by anyone) are
   *  included — same "don't pad with empty columns" rule as the daily
   *  version this replaced, just bucketed coarser to match the monthly
   *  trend chart. */
  months: string[];
  /** Ranked by total volume, same order as recruiterHireRanked. */
  rows: { recruiter: string; total: number; counts: number[] }[];
}

// Same window/anchoring as recruiterHireRanked (see inWindow) and same
// month-bucketing as hireTrendByMonth — this is that same chart's data,
// just broken out per recruiter into a table instead of a single summed
// line. Undated records can't be placed on a month and are excluded here.
export function monthlyHiresByRecruiter(records: HirePerformanceRecord[], sinceMonths = 6): MonthlyHireMatrix {
  const dated = inWindow(records, sinceMonths).filter((r) => r.hiredDate ?? r.submittedDate);
  const months = Array.from(new Set(dated.map((r) => (r.hiredDate ?? r.submittedDate)!.slice(0, 7)))).sort();
  const monthIndex = new Map(months.map((m, i) => [m, i]));

  const byRecruiter = new Map<string, number[]>();
  dated.forEach((r) => {
    const month = (r.hiredDate ?? r.submittedDate)!.slice(0, 7);
    if (!byRecruiter.has(r.recruiter)) byRecruiter.set(r.recruiter, new Array(months.length).fill(0));
    const counts = byRecruiter.get(r.recruiter)!;
    counts[monthIndex.get(month)!] += 1;
  });

  const rows = Array.from(byRecruiter.entries())
    .map(([recruiter, counts]) => ({ recruiter, total: counts.reduce((a, b) => a + b, 0), counts }))
    .sort((a, b) => b.total - a.total);

  return { months, rows };
}
