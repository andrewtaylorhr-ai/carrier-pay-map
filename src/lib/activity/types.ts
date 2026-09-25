// Data model for the "Carrier Activity" page — driver-update workbooks that
// carriers send showing who's been submitted, to which account/lane, and the
// outcome (Active / DQ / Hired). Used to compare submission volume/outcomes
// across carriers to inform which ones are worth working.

export type DriverStatus = "Active" | "DQ" | "Hired";

export interface DriverRecord {
  id: string;
  carrier: string;
  name: string;
  /** The "Position" column in the source file — the account/lane (e.g. "OTR East"). */
  account: string;
  status: DriverStatus;
  /** Raw free-text "Status of application" note from the source file. */
  note: string;
  /**
   * Best-effort recruiter name parsed out of the trailing "- Name" pattern in
   * `note`. Frequently undefined — most notes don't end in a name, and this
   * is intentionally conservative (see extractRecruiter.ts) rather than
   * guessing wrong.
   */
  recruiter?: string;
  /** ISO timestamp of when this batch was imported. */
  importedAt: string;
  /** Original uploaded filename, kept for traceability. */
  sourceFile: string;
  /**
   * Best-effort date (YYYY-MM-DD) pulled from a date-ish column in the source
   * file (Submission Date, Submitted, Orientation Date, Created On, Start
   * Date, Last Updated, Term Date...). Undefined when that carrier's export
   * has no such column — roughly half of them don't (see columns.ts).
   */
  recordDate?: string;
}

export interface CarrierActivityEntry {
  records: DriverRecord[];
  updatedAt: string;
  sourceFile: string;
}

/** Keyed by carrier name (free-form — not tied to the fixed pay-map carrier list). */
export type CarrierActivityData = Record<string, CarrierActivityEntry>;
