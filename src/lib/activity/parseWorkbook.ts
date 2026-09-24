// Parses a carrier's driver-updates export (xlsx or csv) into flat
// DriverRecord rows.
//
// Every carrier's HR/ATS exports this differently — some are multi-tab
// (Active / DQ / Hired, or DQ-NI, or Trainees / Dispatched), some are one
// flat sheet with a Status column, some are CSV. Column names for the same
// field vary too (Name vs First+Last vs "Driver - <id>", Position vs Account
// vs "Location / Site", Recruiter vs "Assigned To" vs "Admin Dropdown").
// This was built and verified against 12 real carrier files with
// genuinely different shapes — see columns.ts / statusClassify.ts for the
// alias/classification logic that makes one parser handle all of them
// instead of hand-rolling a per-carrier adapter.
//
// A "Summary" tab (a count rollup of the real tabs) is always ignored.
import * as XLSX from "xlsx";
import { extractRecruiter } from "./extractRecruiter";
import {
  ACCOUNT_ALIASES,
  NOTE_ALIASES,
  STATUS_ALWAYS_ALIASES,
  STATUS_FALLBACK_ALIASES,
  extractName,
  pickHeader,
  pickRecruiterHeader,
  type RawRow,
} from "./columns";
import { TAB_STATUS, classifyStatusText } from "./statusClassify";
import type { DriverRecord, DriverStatus } from "./types";

// Source files aren't typed consistently ("OTR East" / "OTR EAST" / "otr
// east") — normalize casing/whitespace so the same account doesn't get
// fragmented into multiple breakdown rows. Wording is left untouched (no
// guessing whether "OTR East, LP" and "Otr east lease" are the same thing).
function normalizeAccount(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
}

// Common name-prefix patterns (McIntosh, MacDonald, O'Brien, DeSousa) have a
// legitimate internal capital — don't flatten those, only re-case the rest
// of the word around the prefix.
const NAME_PREFIX_RE = /^(Mc|Mac|O'|De|Di|La|Le|Van|Von)([A-Za-z].*)$/i;

function titleCaseWord(word: string): string {
  if (word.length === 0) return word;
  const m = word.match(NAME_PREFIX_RE);
  if (m) {
    const [, prefix, rest] = m;
    return prefix[0].toUpperCase() + prefix.slice(1).toLowerCase() + rest[0].toUpperCase() + rest.slice(1).toLowerCase();
  }
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

function titleCaseName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().split(" ").map(titleCaseWord).join(" ");
}

export function parseDriverUpdatesWorkbook(
  buffer: ArrayBuffer,
  carrier: string,
  sourceFile: string
): DriverRecord[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const records: DriverRecord[] = [];
  const importedAt = new Date().toISOString();

  for (const sheetName of wb.SheetNames) {
    const trimmedSheet = sheetName.trim();
    if (/^summary$/i.test(trimmedSheet)) continue;

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });
    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0]);
    const tabStatus = TAB_STATUS[trimmedSheet.toLowerCase()] as DriverStatus | undefined;

    const accountHeader = pickHeader(headers, ACCOUNT_ALIASES);
    const noteHeader = pickHeader(headers, NOTE_ALIASES);
    const recruiterHeader = pickRecruiterHeader(headers);

    // Only trust "Update" as a status source when there's no tab default to
    // fall back on — otherwise it's often pure narrative text, not a status.
    const alwaysStatusHeader = pickHeader(headers, STATUS_ALWAYS_ALIASES);
    const fallbackStatusHeader =
      !alwaysStatusHeader && !tabStatus ? pickHeader(headers, STATUS_FALLBACK_ALIASES) : undefined;
    const statusHeader = alwaysStatusHeader ?? fallbackStatusHeader;

    rows.forEach((row, i) => {
      const name = extractName(row, headers);
      if (!name) return; // skip blank rows

      const account = accountHeader
        ? normalizeAccount(String(row[accountHeader] ?? "")) || "UNSPECIFIED"
        : "UNSPECIFIED";

      const note = noteHeader ? String(row[noteHeader] ?? "").trim() : "";

      const rawStatusText = statusHeader ? String(row[statusHeader] ?? "") : "";
      const status: DriverStatus = classifyStatusText(rawStatusText) ?? tabStatus ?? "Active";

      const explicitRecruiter = recruiterHeader ? String(row[recruiterHeader] ?? "").trim() : "";
      const rawRecruiter = explicitRecruiter || extractRecruiter(note);
      // Carrier-entered recruiter names have real typo/casing drift (e.g. PAM's
      // "Heather Mills" / "Heather MIlls" / "HEATHER MILLS" all being one
      // person) — normalize casing only, same principle as normalizeAccount
      // above: fix how it's typed, don't guess at merging different spellings.
      const recruiter = rawRecruiter ? titleCaseName(rawRecruiter) : undefined;

      records.push({
        id: `${carrier}__${sheetName}__${i}__${name}`,
        carrier,
        name,
        account,
        status,
        note,
        recruiter,
        importedAt,
        sourceFile,
      });
    });
  }

  return records;
}
