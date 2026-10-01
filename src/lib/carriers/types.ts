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

// A recruiter's Strategy Plan — new, separate from the state/carrier
// assignment grids above. Targets are monthly; carriers is a simple tag
// list (which carriers this recruiter generally works), independent of
// which carrier is assigned to which state. Keyed by recruiter name, same
// convention as PersistedRecruiterAssignments.
export interface RecruiterPlan {
  targetSubmissions: number | null;
  targetHires: number | null;
  carriers: CarrierId[];
  notes: string;
}
export type PersistedRecruiterPlans = Record<string, RecruiterPlan>;

// Which outsourced team a recruiter belongs to. "unassigned" is the default
// for every recruiter until someone picks a team for them — not stored as a
// key in PersistedRecruiterTeams (absence of a key means unassigned).
export type RecruiterTeam = "uzbek" | "philippines";
export type PersistedRecruiterTeams = Record<string, RecruiterTeam>;

// Whether a recruiter is currently active or a former recruiter who's left/
// been let go. "active" is the default for every recruiter until someone
// marks them inactive — not stored as a key in PersistedRecruiterStatus
// (absence of a key means active), same convention as PersistedRecruiterTeams.
// Inactive recruiters stay in the roster (their history/assignments/plan
// stay visible) but are sorted to the end of every recruiter list and shown
// in red, per explicit user direction for former/fired recruiters.
export type RecruiterStatus = "active" | "inactive";
export type PersistedRecruiterStatus = Record<string, RecruiterStatus>;

// A recruiter's actual submissions/hires for one calendar month, entered by
// hand (no ATS/data-source integration yet). Keyed by recruiter name ->
// month key ("YYYY-MM", see monthKey()/currentAndNextMonth() in
// src/lib/recruiters.ts) -> that month's actuals. Feeds the "Actual"
// columns in MonthlyTargetActualTable and the /reports page, alongside
// each recruiter's single ongoing target from their Strategy Plan.
export interface RecruiterActual {
  submissions: number | null;
  hires: number | null;
}
export type PersistedRecruiterActuals = Record<string, Record<string, RecruiterActual>>;

// ---- Monthly Report (per-calendar-month company-wide performance report) ----
// Separate from RecruiterPlan/RecruiterActual (which track per-recruiter
// targets/actuals) and separate from CarrierId (which is the 5-carrier
// territory-assignment enum used by the map). This report's carrier
// breakdown covers every carrier the company actually submits drivers to
// (21+ names in the source report), so carrier names here are free text,
// not CarrierId. Keyed by month ("YYYY-MM", same convention as monthKey()
// in src/lib/recruiters.ts, but this feature supports arbitrary/historical
// months, not just current+next).
export interface CarrierMonthlyStat {
  carrier: string;
  submissions: number | null;
  dqNoResponse: number | null;
  hired: number | null;
  notes: string;
}

export interface WeeklySubmissionStat {
  label: string; // e.g. "8/3-8/8"
  submissions: number | null;
}

// One row of the per-state monthly breakdown. Real data entry (not a
// computed/guessed value) — this is what the "Hires" map color mode reads
// to shade each state, so the user can visually spot their best state by
// color instead of a single computed "Best State" text field (which this
// replaces entirely, per explicit user direction).
export interface StateMonthlyStat {
  state: string; // full state name, matches ALL_STATES / topojson properties.name
  submissions: number | null;
  hired: number | null;
  notes: string;
}

// One row of the per-month DQ-reason breakdown. "% of Lost Drivers" is
// always computed live (count / total DQ'd that month), never stored,
// matching this app's "derive, don't duplicate" convention.
export interface DqReasonStat {
  reason: string;
  count: number | null;
  notes: string;
}

// Fields the user enters by hand each month (not derivable from other data
// already in the app) — everything else (Hire %, Leads→Hire %, Avg per
// recruiter, Best Carrier, totals) is computed live from these + the
// carrier rows, never stored redundantly.
// averageCpl is a manual entry (not totalIndeedSpend / totalLeads) because
// the source report's own numbers don't reconcile that way — CPL is tracked
// per Indeed campaign in a separate sheet this app doesn't ingest, so
// deriving it here from the two company-wide totals would silently produce
// a wrong number. Better to store what was actually reported.
export interface MonthlyReport {
  totalLeads: number | null;
  totalDqp: number | null;
  dqFromDqp: number | null;
  activeRecruiters: number | null;
  totalIndeedSpend: number | null;
  indeedAccountsTotal: number | null;
  indeedAccountsActive: number | null;
  averageCpl: number | null;
  weeklySubmissions: WeeklySubmissionStat[];
  carriers: CarrierMonthlyStat[];
  stateBreakdown: StateMonthlyStat[];
  dqReasons: DqReasonStat[];
}
export type PersistedMonthlyReports = Record<string, MonthlyReport>;

export const EMPTY_MONTHLY_REPORT: MonthlyReport = {
  totalLeads: null,
  totalDqp: null,
  dqFromDqp: null,
  activeRecruiters: null,
  totalIndeedSpend: null,
  indeedAccountsTotal: null,
  indeedAccountsActive: null,
  averageCpl: null,
  weeklySubmissions: [],
  carriers: [],
  stateBreakdown: [],
  dqReasons: [],
};
