// Ported 1:1 from exportRecruiterReportToExcel() in the original HTML, using
// the npm `xlsx` (SheetJS) package instead of the CDN build — same codebase,
// same sheet shape (12 columns, frozen header, autofilter).
import * as XLSX from "xlsx";
import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { getStateAccountRows } from "@/lib/carriers/logic";
import type { PersistedAssignments, PersistedRecruiterAssignments } from "@/lib/carriers/types";

interface ExportRow {
  State: string;
  Recruiter: string;
  "Shared With": string;
  "Assigned Carrier": string;
  Carrier: string;
  "Assigned?": string;
  Category: string;
  Account: string;
  "Approval Needed": string;
  Pay: string;
  "Home Time": string;
  Notes: string;
}

// Regression guard for a bug that shipped once already and was explicitly
// rejected ("not professional"): literal HTML leaking into an exported cell.
// Dev-only — a raw npm build has no console reading it, so this is free in prod.
function warnIfLooksLikeHtml(row: ExportRow) {
  if (process.env.NODE_ENV === "production") return;
  for (const [field, value] of Object.entries(row)) {
    if (typeof value === "string" && /<[a-z][\s\S]*>/i.test(value)) {
      // eslint-disable-next-line no-console
      console.warn(`[exportRecruiterReport] Field "${field}" looks like it contains HTML markup:`, value);
    }
  }
}

export function exportRecruiterReportToExcel(
  recruiterFilter: string,
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments
): void {
  if (!recruiterFilter) return;
  const states = Object.keys(recruiterAssignments)
    .filter((s) => (recruiterAssignments[s] || []).includes(recruiterFilter))
    .sort();
  const rows: ExportRow[] = [];
  states.forEach((state) => {
    const assignedId = assignments[state];
    const assignedLabel = assignedId ? CARRIERS[assignedId].label : "(unassigned)";
    const sharedWith = (recruiterAssignments[state] || []).filter((r) => r !== recruiterFilter).join(", ");
    let anyForState = false;
    CARRIER_ORDER.forEach((id) => {
      CARRIERS[id].cats.forEach((cat) => {
        const acctRows = getStateAccountRows(id, cat, state);
        if (!acctRows.length) return;
        anyForState = true;
        acctRows.forEach((a) => {
          rows.push({
            State: state,
            Recruiter: recruiterFilter,
            "Shared With": sharedWith,
            "Assigned Carrier": assignedLabel,
            Carrier: CARRIERS[id].label,
            "Assigned?": id === assignedId ? "Yes" : "",
            Category: cat,
            Account: a.account,
            "Approval Needed": a.approval,
            Pay: a.pay,
            "Home Time": a.hometime,
            Notes: a.notes,
          });
        });
      });
    });
    if (!anyForState) {
      rows.push({
        State: state,
        Recruiter: recruiterFilter,
        "Shared With": sharedWith,
        "Assigned Carrier": assignedLabel,
        Carrier: "",
        "Assigned?": "",
        Category: "",
        Account: "",
        "Approval Needed": "",
        Pay: "No carrier data available for this state.",
        "Home Time": "",
        Notes: "",
      });
    }
  });

  if (!rows.length) {
    alert(`No assigned states to export for ${recruiterFilter}.`);
    return;
  }

  rows.forEach(warnIfLooksLikeHtml);

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 9 },
    { wch: 24 },
    { wch: 34 },
    { wch: 15 },
    { wch: 44 },
    { wch: 24 },
    { wch: 60 },
  ];
  ws["!autofilter"] = { ref: ws["!ref"] as string };
  // NOTE: the free/community `xlsx` (SheetJS CE) package does not actually
  // write frozen panes — its writer has a no-op case for 'freezepanes'
  // (confirmed in node_modules/xlsx/xlsx.js). This matches the original CDN
  // build's behavior (same SheetJS codebase), so the header row was never
  // truly frozen there either. Left set for forward-compatibility / parity
  // with the original source, but don't expect it to take effect.
  ws["!views"] = [{ state: "frozen", ySplit: 1 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, recruiterFilter.slice(0, 31));
  XLSX.writeFile(wb, `${recruiterFilter.replace(/[^a-z0-9]+/gi, "_")}_assigned_states.xlsx`);
}
