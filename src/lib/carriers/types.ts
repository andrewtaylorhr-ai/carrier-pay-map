// Types mirroring the original Multi_Carrier_Pay_Map.html data shapes and
// derived-record shapes exactly. Kept loosely typed where the original was
// loosely typed (e.g. `cats: string[]`) — this is a solo-user internal tool,
// not a shared library, so there's no value in over-formalizing.

export type CarrierId = "swift" | "usx" | "pam" | "transam" | "cre";

export interface CarrierMeta {
  label: string;
  color: string;
  logo: string;
  cats: string[];
}

export type CarriersById = Record<CarrierId, CarrierMeta>;

// A resolved "this carrier/category/state" record, as returned by
// getStateRecord(). `value` drives the choropleth color scale; `flatNo`
// marks the "does not hire here" state for binary (isFlatCategory) carriers.
export interface StateRecord {
  value: number | null;
  flatNo?: boolean;
  tooltipLines: string[];
  detail: string; // HTML string — ported verbatim, rendered via dangerouslySetInnerHTML
}

// One row of the "account-level" breakdown, used both by RecruiterReport's
// on-screen carrier blocks and by the Excel export.
export interface AccountRow {
  account: string;
  approval: string;
  pay: string;
  hometime: string;
  notes: string;
}

// ---- SWIFT ----
export interface SwiftStateEntry {
  n: number;
  avg_low: number;
  avg_high: number;
  max_high: number;
  n_yes: number;
  n_no: number;
  yes_accts: string[];
  no_accts: string[];
}
// SWIFT_DATA[cat][state] -> entry | undefined
export type SwiftData = Record<string, Record<string, SwiftStateEntry>>;

// ---- USX ----
export type CpmTier = [string, number];

export interface UsxOtrSoloRegion {
  cpm: CpmTier[];
  states: string[];
}
export type UsxOtrSoloRegions = Record<string, UsxOtrSoloRegion>;

export type UsxLoyalty = [string, string][];
export type UsxShorthaul = [string, string][];
export type UsxStateRegion = Record<string, string>;

export interface UsxDedicatedAccount {
  name: string;
  states: string[];
  payLow: number | null;
  payHigh: number | null;
  note?: string;
}

export interface UsxOtrRegionalSubfleet {
  states: string[];
  cpm: CpmTier[];
  note: string;
}
export interface UsxOtrRegionalSecondary {
  note: string;
  pay: string;
}
export interface UsxOtrRegional {
  northeast: UsxOtrRegionalSubfleet;
  southeast: UsxOtrRegionalSecondary;
  westcoast: UsxOtrRegionalSecondary;
}

// ---- PAM ----
export interface PamDomicile {
  city: string;
  state: string;
  tier: string;
  hometime: string;
  division?: string;
}
export interface PamTierCpmEntry {
  students: number | null;
  mo3: number | null;
  yr1: number | null;
  yr3: number | null;
}
export type PamTierCpm = Record<string, PamTierCpmEntry>;

// ---- CR England ----
export interface CreAccount {
  name: string;
  states: string[];
  cadence: string; // key into CRE_CADENCE_LABEL
  type?: string;
  bonusLane?: boolean;
  avgWeekly?: number | null;
  avgAnnual?: number | null;
  top10Weekly?: number | null;
  top10Annual?: number | null;
  hometime: string;
  notes?: string;
}
export type CreCadenceLabel = Record<string, string>;

// ---- persisted localStorage shapes (keys unchanged from the original) ----
export type PersistedAssignments = Record<string, CarrierId>;
export type PersistedRecruiters = string[];
export type PersistedRecruiterAssignments = Record<string, string[]>;
