// Parses a carrier's "Driver Updates" workbook (Active / DQ / Hired tabs,
// each with Name / Position / Status of application columns) into flat
// DriverRecord rows. A "Summary" tab (or any other unrecognized tab name) is
// ignored — it's just a count rollup of the three real tabs.
import * as XLSX from "xlsx";
import { extractRecruiter } from "./extractRecruiter";
import type { DriverRecord, DriverStatus } from "./types";

const STATUS_TABS: Record<string, DriverStatus> = {
  Active: "Active",
  DQ: "DQ",
  Hired: "Hired",
};

type RawRow = Record<string, unknown>;

// Source files aren't typed consistently ("OTR East" / "OTR EAST" / "otr
// east") — normalize casing/whitespace so the same account doesn't get
// fragmented into multiple breakdown rows. Wording is left untouched (no
// guessing whether "OTR East, LP" and "Otr east lease" are the same thing).
function normalizeAccount(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
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
    const status = STATUS_TABS[sheetName.trim()];
    if (!status) continue;

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });

    rows.forEach((row, i) => {
      const name = String(row["Name"] ?? "").trim();
      if (!name) return; // skip blank rows

      const account = normalizeAccount(String(row["Position"] ?? "")) || "UNSPECIFIED";
      const note = String(row["Status of application"] ?? "").trim();

      records.push({
        id: `${carrier}__${sheetName}__${i}__${name}`,
        carrier,
        name,
        account,
        status,
        note,
        recruiter: extractRecruiter(note),
        importedAt,
        sourceFile,
      });
    });
  }

  return records;
}
