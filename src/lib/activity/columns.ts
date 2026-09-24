// Header-detection helpers for the driver-update parser. Every carrier's
// export uses different column names for the same logical field (Name vs
// First/Last, Position vs Account vs "Location / Site", Recruiter vs
// "Assigned To" vs "Admin Dropdown" vs "NFI Recruiter"...). These helpers
// map a sheet's actual headers onto the logical fields we need, without
// hardcoding a schema per carrier.

export type RawRow = Record<string, unknown>;

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

// Returns the first header (original casing preserved) whose normalized form
// matches an alias, trying aliases in priority order.
export function pickHeader(headers: string[], aliases: string[]): string | undefined {
  const byNorm = new Map(headers.map((h) => [normalizeHeader(h), h]));
  for (const alias of aliases) {
    const hit = byNorm.get(alias);
    if (hit) return hit;
  }
  return undefined;
}

export function pickHeaderByRegex(headers: string[], re: RegExp): string | undefined {
  return headers.find((h) => re.test(h));
}

const ID_SUFFIX_RE = /\s+-\s+\d{4,}\s*$/; // strips " - 20518347" (JB Hunt's embedded applicant IDs)

// Name is either a single "Name"/"Driver" column (sometimes with a trailing
// " - <id>" suffix to strip) or separate First/Last columns to join.
export function extractName(row: RawRow, headers: string[]): string {
  const singleHeader = pickHeader(headers, ["name", "driver"]);
  if (singleHeader) {
    return String(row[singleHeader] ?? "")
      .replace(ID_SUFFIX_RE, "")
      .trim();
  }

  const firstHeader = pickHeader(headers, ["first name", "first"]);
  const lastHeader = pickHeader(headers, ["last name", "last"]);
  if (firstHeader || lastHeader) {
    const first = firstHeader ? String(row[firstHeader] ?? "").trim() : "";
    const last = lastHeader ? String(row[lastHeader] ?? "").trim() : "";
    return `${first} ${last}`.trim();
  }

  return "";
}

export const ACCOUNT_ALIASES = ["position / account", "position", "account", "location / site", "location"];

// Status columns that are genuine controlled-vocabulary status fields
// (trustworthy enough to classify regardless of which tab the row is on).
export const STATUS_ALWAYS_ALIASES = ["status", "status of application", "decision code"];

// "Update" is sometimes a disguised status column (NFI: "HIRED 6/8/2026",
// "Not Interested") and sometimes pure narrative (Barr-Nunn, Transco: full
// sentences). It's only safe to lean on when there's no tab-based default to
// fall back to instead — see parseWorkbook.ts.
export const STATUS_FALLBACK_ALIASES = ["update"];

export const NOTE_ALIASES = ["notes", "note", "update", "status of application", "decision code"];

const RECRUITER_ALIASES = ["recruiter", "assigned recruiter", "assigned to", "admin dropdown"];
const RECRUITER_HEADER_RE = /recruiter/i;

export function pickRecruiterHeader(headers: string[]): string | undefined {
  return pickHeader(headers, RECRUITER_ALIASES) ?? pickHeaderByRegex(headers, RECRUITER_HEADER_RE);
}
