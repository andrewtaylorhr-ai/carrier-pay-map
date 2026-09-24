import type { DriverStatus } from "./types";

// Tab/sheet names seen across real carrier exports so far, mapped to the
// status that tab implies by default. Matched case-insensitively against the
// trimmed sheet name. Sheets not listed here (flat single-sheet exports like
// "All Drivers", "Sheet1", or a timestamped report-export name) have no tab
// default — status for those rows is derived entirely from a per-row status
// column instead (see parseWorkbook.ts).
export const TAB_STATUS: Record<string, DriverStatus> = {
  active: "Active",
  dq: "DQ",
  "dq-ni": "DQ",
  hired: "Hired",
  trainees: "Active", // PAM: still pre-hire, in training pipeline
  dispatched: "Hired", // PAM: hired and now driving
  "pipeline report": "Active", // JB Hunt: still open pipeline
  "reject-decline report": "DQ", // JB Hunt
  "dtw report": "Active", // JB Hunt: post-offer onboarding, not yet confirmed hired
};

// Carriers' own "Status" text is wildly inconsistent (see the 12 real files
// this was built against — everything from "RC Denied" to "No RC - DQ" to
// "Hired - Trainee" to raw decision codes like "Reject-Requirements-MVR").
// Rather than enumerate every carrier's vocabulary, classify by keyword: a
// strong "hired" or "disqualified/declined/etc" signal overrides whatever
// tab/sheet the row happens to live on (carriers' own tab placement lags
// reality sometimes — e.g. a driver still sitting on an "Active" tab with a
// per-row status of "DQ"). Anything that doesn't match a keyword returns
// null so the caller can fall back to the tab default instead of guessing.
const HIRED_RE = /\bhired?\b|\bdispatch(ed)?\b/i;
const DQ_RE =
  /disqualif|declin|reject|not interested|no longer interested|not workable|no response|no show|\bdenied\b|\bnli\b|duplicate|not qualified|not elig|\bdq\b|\bterm(ed)?\b|do not contact|\bawol\b/i;

export function classifyStatusText(raw: string): DriverStatus | null {
  const s = raw.trim();
  if (!s) return null;
  if (HIRED_RE.test(s)) return "Hired";
  if (DQ_RE.test(s)) return "DQ";
  // "Closed" alone (Day & Ross's dominant status value) reads as "file
  // closed, not moving forward" — but only trust it as a short status token,
  // not inside a long freeform narrative note where "closed" could mean
  // something else entirely (e.g. "the account is closed to new drivers").
  if (s.length <= 20 && /\bclosed\b/i.test(s)) return "DQ";
  return null;
}
