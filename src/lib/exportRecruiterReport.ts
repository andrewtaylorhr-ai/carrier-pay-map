// Per-recruiter Strategy Builder export, for managers to send to each
// recruiter: their states (with the carriers assigned to each) plus one row
// per carrier account they're assigned to work. Uses the npm `xlsx`
// (SheetJS CE) package — real columns with autofilter, no cell styling
// (CE can't write styles).
import * as XLSX from "xlsx";
import { ACCOUNTS_BY_ID, accountsInStates, formatPay } from "@/lib/carriers/accounts";
import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import type {
  Account,
  CarrierId,
  PersistedAssignments,
  PersistedRecruiterAccounts,
  PersistedRecruiterAssignments,
} from "@/lib/carriers/types";

interface StateRow {
  State: string;
  "Carriers Assigned": string;
  "Shared With": string;
  "Your Accounts Here": number;
}

interface AccountExportRow {
  Carrier: string;
  Category: string;
  Account: string;
  "Your States": string;
  "Other Hiring States": string;
  Pay: string;
  Bonus: string;
  "Home Time": string;
  Experience: string;
  "Approval Needed": string;
  Notes: string;
}

// Regression guard for a bug that shipped once already and was explicitly
// rejected ("not professional"): literal HTML leaking into an exported cell.
// Dev-only — a raw npm build has no console reading it, so this is free in prod.
function warnIfLooksLikeHtml(row: object) {
  if (process.env.NODE_ENV === "production") return;
  for (const [field, value] of Object.entries(row)) {
    if (typeof value === "string" && /<[a-z][\s\S]*>/i.test(value)) {
      // eslint-disable-next-line no-console
      console.warn(`[exportRecruiterReport] Field "${field}" looks like it contains HTML markup:`, value);
    }
  }
}

export function recruiterStates(recruiter: string, recruiterAssignments: PersistedRecruiterAssignments): string[] {
  return Object.keys(recruiterAssignments)
    .filter((s) => (recruiterAssignments[s] || []).includes(recruiter))
    .sort();
}

// The accounts a recruiter is assigned, in carrier order. Ids that no longer
// exist (account closed in a later data refresh) are skipped.
export function recruiterAssignedAccounts(recruiter: string, recruiterAccounts: PersistedRecruiterAccounts): Account[] {
  const list = Array.from(new Set(recruiterAccounts[recruiter] || []))
    .map((id) => ACCOUNTS_BY_ID.get(id))
    .filter((a): a is Account => !!a);
  const order = (id: CarrierId) => CARRIER_ORDER.indexOf(id);
  return list.sort(
    (a, b) => order(a.carrier) - order(b.carrier) || a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name)
  );
}

// The accounts that go in a recruiter's plan (Excel file and map picture).
// Nothing ticked yet: fall back to every open account in their states for
// the carriers assigned to each state, so the download is still useful.
export function recruiterPlanAccounts(
  recruiter: string,
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments,
  recruiterAccounts: PersistedRecruiterAccounts
): { accounts: Account[]; fallback: boolean } {
  const stateSet = new Set(recruiterStates(recruiter, recruiterAssignments));
  const ticked = recruiterAssignedAccounts(recruiter, recruiterAccounts);
  if (ticked.length) return { accounts: ticked, fallback: false };
  const accounts = accountsInStates([...stateSet]).filter((a) =>
    a.states.some((s) => stateSet.has(s) && (!(assignments[s] || []).length || assignments[s].includes(a.carrier)))
  );
  return { accounts, fallback: true };
}

function buildRecruiterRows(
  recruiter: string,
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments,
  recruiterAccounts: PersistedRecruiterAccounts
) {
  const states = recruiterStates(recruiter, recruiterAssignments);
  const stateSet = new Set(states);
  const { accounts, fallback } = recruiterPlanAccounts(recruiter, assignments, recruiterAssignments, recruiterAccounts);

  const accountRows: AccountExportRow[] = accounts.map((a) => ({
    Carrier: CARRIERS[a.carrier].label,
    Category: a.cat,
    Account: a.name,
    "Your States": a.states.filter((s) => stateSet.has(s)).join(", ") || "(outside your states)",
    "Other Hiring States": a.states.filter((s) => !stateSet.has(s)).join(", "),
    Pay: formatPay(a),
    Bonus: a.sob,
    "Home Time": a.hometime,
    Experience: a.experience,
    "Approval Needed": a.approval,
    Notes: a.notes,
  }));

  const stateRows: StateRow[] = states.map((s) => ({
    State: s,
    "Carriers Assigned": (assignments[s] || []).map((id) => CARRIERS[id].label).join(", ") || "(none yet)",
    "Shared With": (recruiterAssignments[s] || []).filter((r) => r !== recruiter).join(", "),
    "Your Accounts Here": accounts.filter((a) => a.states.includes(s)).length,
  }));

  accountRows.forEach(warnIfLooksLikeHtml);
  return { states, stateRows, accountRows, fallback };
}

const ACCOUNT_COLS = [14, 22, 38, 26, 26, 40, 22, 26, 22, 10, 60].map((wch) => ({ wch }));
const STATE_COLS = [16, 34, 24, 12].map((wch) => ({ wch }));

function sheetFrom<T extends object>(rows: T[], cols: { wch: number }[], emptyNote: string) {
  const ws = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([[emptyNote]]);
  ws["!cols"] = cols;
  if (rows.length) ws["!autofilter"] = { ref: ws["!ref"] as string };
  return ws;
}

// Excel sheet names: max 31 chars, no \ / ? * [ ] :, unique (case-insensitive).
function sheetName(s: string, used: Set<string>): string {
  const base = s.replace(/[\\/?*[\]:]/g, " ").slice(0, 28) || "Sheet";
  let name = base;
  for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base.slice(0, 25)} ${n}`;
  used.add(name.toLowerCase());
  return name;
}

export function exportRecruiterReportToExcel(
  recruiter: string,
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments,
  recruiterAccounts: PersistedRecruiterAccounts
): void {
  if (!recruiter) return;
  const { states, stateRows, accountRows, fallback } = buildRecruiterRows(
    recruiter,
    assignments,
    recruiterAssignments,
    recruiterAccounts
  );
  if (!states.length && !accountRows.length) {
    alert(`${recruiter} has no states or accounts assigned yet.`);
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    sheetFrom(accountRows, ACCOUNT_COLS, "No accounts in this recruiter's states."),
    fallback ? "All accounts in your states" : "Your accounts"
  );
  XLSX.utils.book_append_sheet(wb, sheetFrom(stateRows, STATE_COLS, "No states assigned."), "Your states");
  XLSX.writeFile(wb, `${recruiter.replace(/[^a-z0-9]+/gi, "_")}_strategy.xlsx`);
}

// One workbook for the whole team: a Summary sheet, then one sheet per
// recruiter with their assigned accounts.
export function exportAllRecruitersToExcel(
  recruiters: string[],
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments,
  recruiterAccounts: PersistedRecruiterAccounts
): void {
  const built = recruiters
    .map((r) => ({ r, ...buildRecruiterRows(r, assignments, recruiterAssignments, recruiterAccounts) }))
    .filter((b) => b.states.length || (recruiterAccounts[b.r] || []).length);
  if (!built.length) {
    alert("No recruiter has states or accounts assigned yet.");
    return;
  }
  const used = new Set<string>();
  const wb = XLSX.utils.book_new();
  const summary = built.map((b) => ({
    Recruiter: b.r,
    States: b.states.join(", "),
    Carriers: Array.from(new Set(b.states.flatMap((s) => assignments[s] || [])))
      .map((id) => CARRIERS[id].label)
      .join(", "),
    "Accounts Assigned": b.fallback ? 0 : b.accountRows.length,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    sheetFrom(summary, [16, 50, 34, 16].map((wch) => ({ wch })), ""),
    sheetName("Summary", used)
  );
  built.forEach((b) => {
    XLSX.utils.book_append_sheet(
      wb,
      sheetFrom(
        b.fallback ? [] : b.accountRows,
        ACCOUNT_COLS,
        `No accounts ticked for ${b.r} yet — states: ${b.states.join(", ") || "none"}.`
      ),
      sheetName(b.r, used)
    );
  });
  XLSX.writeFile(wb, `Recruiter_Strategy_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// One row of the whole-team Reports page — target vs. actual for a single
// recruiter for a single selected month, plus their states/carriers
// footprint. Exported as-is (the same rows rendered on screen), unlike
// exportRecruiterReportToExcel above which expands into a per-account
// breakdown for one recruiter.
export interface TeamReportRow {
  Recruiter: string;
  Team: string;
  Month: string;
  "Target Submissions": number | string;
  "Actual Submissions": number | string;
  "Target Hires": number | string;
  "Actual Hires": number | string;
  "Hire Rate": string;
  "States Assigned": number;
  "Carriers Assigned": number;
}

export function exportTeamReportToExcel(rows: TeamReportRow[], monthLabel: string): void {
  if (!rows.length) {
    alert("No recruiters to export.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 11 },
    { wch: 15 },
    { wch: 17 },
  ];
  ws["!autofilter"] = { ref: ws["!ref"] as string };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Team report");
  XLSX.writeFile(wb, `Team_Report_${monthLabel.replace(/[^a-z0-9]+/gi, "_")}.xlsx`);
}
