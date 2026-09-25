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
  DATE_ALIASES,
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

// Only "Mc" and "O'" are safe to special-case: no common first name starts
// with either, so preserving an internal capital there (McIntosh, O'Brien)
// never collides with an ordinary name. Broader prefixes (Mac, De, Di, La,
// Le, Van, Von) were tried and reverted — they collided with real first
// names in this data (Macy -> "MacY", Lauren -> "LaUren", Laurie Larsen ->
// "LaUrie LaRsen", Lance -> "LaNce"), which is worse than the rare miss on
// an all-caps "MACDONALD"/"LAFLEUR"-style surname falling back to plain
// title-case.
const NAME_PREFIX_RE = /^(Mc|O')([A-Za-z].*)$/i;

function titleCaseWord(word: string): string {
  if (word.length === 0) return word;
  const m = word.match(NAME_PREFIX_RE);
  if (m) {
    const [, prefix, rest] = m;
    return prefix[0].toUpperCase() + prefix.slice(1).toLowerCase() + rest[0].toUpperCase() + rest.slice(1).toLowerCase();
  }
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

export function titleCaseName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().split(" ").map(titleCaseWord).join(" ");
}

const MDY_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
const ISO_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})/;

// Best-effort date extraction. Cell values arrive in three shapes depending
// on how the source file typed the column: a real Date object (thanks to
// `cellDates: true` below), a bare Excel serial number (untyped/older
// files), or plain text ("9/28/2026"). Date objects from SheetJS are built
// with Date.UTC, so they must be read back with the UTC getters — reading
// them with local getters would shift the day in any timezone behind UTC.
// Text dates are parsed manually for the common mm/dd/yyyy and yyyy-mm-dd
// shapes (also timezone-safe) before falling back to the JS Date parser.
export function parseDateValue(v: unknown): string | undefined {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return undefined;
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof v === "number") {
    if (v < 1 || v > 60000) return undefined; // sanity bound: excel serials for ~1900-2064
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (isNaN(d.getTime())) return undefined;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    const mdy = s.match(MDY_RE);
    if (mdy) {
      const [, m, d, y] = mdy;
      const year = y.length === 2 ? `20${y}` : y;
      return `${year.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const iso = s.match(ISO_PREFIX_RE);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
  }
  return undefined;
}

export function parseDriverUpdatesWorkbook(
  buffer: ArrayBuffer,
  carrier: string,
  sourceFile: string
): DriverRecord[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
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
    const dateHeader = pickHeader(headers, DATE_ALIASES);

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

      const recordDate = dateHeader ? parseDateValue(row[dateHeader]) : undefined;

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
        recordDate,
      });
    });
  }

  return records;
}
