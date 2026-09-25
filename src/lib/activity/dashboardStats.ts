// Pure, data-driven stats for the "Recruiter Strategy & Carrier Insights"
// dashboard section at the top of the Activity page. Everything here is
// derived from the real CarrierActivityData already in localStorage — no
// invented deltas, no fake identities. If a screenshot element needs data
// this model doesn't have (e.g. per-state driver counts), it's best-effort
// derived here and documented as such, never fabricated outright.

import { accountBreakdown, carrierTotals, hireRate, type StatusCounts } from "./analyze";
import { dqReasonsForRecords, type DqReasonRow } from "./dqReasons";
import type { CarrierActivityData, DriverRecord } from "./types";

// Chart palette — used consistently across the bar chart, donut chart, and
// any per-carrier color chip in the new dashboard. Chosen to read clearly on
// the dark --cpm-bg surface; --cpm-accent (gold) reserved for the #1 slice.
export const CHART_PALETTE = [
  "#d4a137", // cpm-accent — top carrier
  "#5b9bd8",
  "#4ade80",
  "#e5484d",
  "#a78bfa",
  "#f0883e",
  "#2dd4bf",
  "#f472b6",
];
export const CHART_OTHERS_COLOR = "#6b7280"; // cpm-text-faint

export function colorForIndex(i: number): string {
  return CHART_PALETTE[i % CHART_PALETTE.length];
}

// --- Best-effort state extraction ------------------------------------------
// DriverRecord has no `state` field — the source workbooks don't reliably
// carry one. Accounts/lanes are frequently named like "OTR East - TX" or
// "Regional TX/OK/LA" though, so we scan the account string for standalone
// 2-letter tokens that are valid USPS state codes. Returns [] when nothing
// matches; callers must treat that as "unknown", not "no states".
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
]);

export function statesFromAccount(account: string): string[] {
  // \b...\b (not the old bare /[A-Z]{2}/g) so this only matches standalone
  // 2-letter tokens — the unbounded version matched mid-word letter pairs
  // too (e.g. "WA" and "AR" inside "WALMART"), which was producing bogus
  // state hits on any account name containing that substring.
  const tokens = account.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
  const found = new Set<string>();
  tokens.forEach((t) => {
    if (US_STATE_CODES.has(t)) found.add(t);
  });
  return Array.from(found);
}

// --- Overall KPI totals ------------------------------------------------------

export interface OverallTotals {
  totalSubmissions: number;
  totalHires: number;
  totalDq: number;
  totalActive: number;
  hireRate: number | null;
  carrierCount: number;
  recruiterCount: number;
}

export function overallTotals(data: CarrierActivityData): OverallTotals {
  const counts: StatusCounts = { active: 0, dq: 0, hired: 0, total: 0 };
  const recruiters = new Set<string>();
  Object.values(data).forEach((entry) => {
    entry.records.forEach((r) => {
      counts.total += 1;
      if (r.status === "Active") counts.active += 1;
      else if (r.status === "DQ") counts.dq += 1;
      else if (r.status === "Hired") counts.hired += 1;
      if (r.recruiter) recruiters.add(r.recruiter);
    });
  });
  return {
    totalSubmissions: counts.total,
    totalHires: counts.hired,
    totalDq: counts.dq,
    totalActive: counts.active,
    hireRate: hireRate(counts),
    carrierCount: Object.keys(data).length,
    recruiterCount: recruiters.size,
  };
}

// --- Carrier volume + rejection reasons (bar chart, donut, carrier performance table) ---

export interface CarrierVolumeRow {
  carrier: string;
  counts: StatusCounts;
  rate: number | null;
  /** DQ share of decided outcomes (dq / (hired + dq)) — the mirror of `rate`. Null under the same conditions `rate` is null. */
  dqRate: number | null;
  recruiterCount: number;
  /** Categorized rejection reasons for this carrier's DQ records, most-common first. */
  dqReasons: DqReasonRow[];
  color: string;
}

export function carrierVolumeRanked(data: CarrierActivityData): CarrierVolumeRow[] {
  return Object.keys(data)
    .map((carrier) => {
      const counts = carrierTotals(data[carrier].records);
      const recruiters = new Set<string>();
      data[carrier].records.forEach((r) => {
        if (r.recruiter) recruiters.add(r.recruiter);
      });
      const rate = hireRate(counts);
      return {
        carrier,
        counts,
        rate,
        dqRate: rate !== null ? 1 - rate : null,
        recruiterCount: recruiters.size,
        dqReasons: dqReasonsForRecords(data[carrier].records),
      };
    })
    .sort((a, b) => b.counts.total - a.counts.total)
    .map((row, i) => ({ ...row, color: colorForIndex(i) }));
}

export interface ChartSlice {
  name: string;
  value: number;
  color: string;
}

// Groups the tail of a ranked list into a single gray "Others" slice so the
// donut/bar charts stay readable when there are many carriers. With the
// carrier counts this app typically sees (a handful), this is usually a
// no-op — it's a safety valve, not the common case.
export function groupedForChart(rows: CarrierVolumeRow[], topN = 6): ChartSlice[] {
  const head = rows.slice(0, topN).map((r) => ({ name: r.carrier, value: r.counts.total, color: r.color }));
  const tail = rows.slice(topN);
  if (tail.length === 0) return head;
  const othersTotal = tail.reduce((sum, r) => sum + r.counts.total, 0);
  return [...head, { name: "Others", value: othersTotal, color: CHART_OTHERS_COLOR }];
}

// --- Recruiter performance table ---------------------------------------------

export interface RecruiterPerfRow {
  recruiter: string;
  counts: StatusCounts;
  rate: number | null;
  topCarrier: string | null;
  topAccount: string | null;
  topStates: string[];
  /** Every carrier this recruiter has submissions under — used for table filtering, not just display. */
  carriers: string[];
  /** Every state detected across this recruiter's accounts — used for table filtering, not just display. */
  states: string[];
  carrierCount: number;
}

export function recruiterPerformance(data: CarrierActivityData): RecruiterPerfRow[] {
  interface Acc {
    counts: StatusCounts;
    byCarrier: Map<string, number>;
    byAccount: Map<string, number>;
    byState: Map<string, number>;
  }
  const map = new Map<string, Acc>();

  Object.keys(data).forEach((carrier) => {
    data[carrier].records.forEach((r: DriverRecord) => {
      if (!r.recruiter) return;
      if (!map.has(r.recruiter)) {
        map.set(r.recruiter, {
          counts: { active: 0, dq: 0, hired: 0, total: 0 },
          byCarrier: new Map(),
          byAccount: new Map(),
          byState: new Map(),
        });
      }
      const acc = map.get(r.recruiter)!;
      acc.counts.total += 1;
      if (r.status === "Active") acc.counts.active += 1;
      else if (r.status === "DQ") acc.counts.dq += 1;
      else if (r.status === "Hired") acc.counts.hired += 1;
      acc.byCarrier.set(carrier, (acc.byCarrier.get(carrier) ?? 0) + 1);
      acc.byAccount.set(r.account, (acc.byAccount.get(r.account) ?? 0) + 1);
      statesFromAccount(r.account).forEach((s) => acc.byState.set(s, (acc.byState.get(s) ?? 0) + 1));
    });
  });

  const top = (m: Map<string, number>): string | null => {
    let best: string | null = null;
    let bestN = -1;
    m.forEach((n, k) => {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    });
    return best;
  };

  return Array.from(map.entries())
    .map(([recruiter, acc]) => ({
      recruiter,
      counts: acc.counts,
      rate: hireRate(acc.counts),
      topCarrier: top(acc.byCarrier),
      topAccount: top(acc.byAccount),
      topStates: Array.from(acc.byState.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s),
      carriers: Array.from(acc.byCarrier.keys()),
      states: Array.from(acc.byState.keys()),
      carrierCount: acc.byCarrier.size,
    }))
    .sort((a, b) => b.counts.total - a.counts.total);
}

// Rejection-reason breakdown across every carrier combined — feeds the
// dashboard's top-level "Total rejections" KPI sub-label and the standalone
// reasons panel, so the "why" behind DQs is visible at a glance before
// drilling into any one carrier.
export function overallDqReasons(data: CarrierActivityData): DqReasonRow[] {
  return dqReasonsForRecords(Object.values(data).flatMap((e) => e.records));
}

// --- DQs by account (carrier performance table's account-level companion) ---

export interface AccountDqRow {
  carrier: string;
  account: string;
  counts: StatusCounts;
  dqRate: number | null;
  dqReasons: DqReasonRow[];
}

// Answers "which account/lane are the rejections actually coming from" —
// one level more specific than the per-carrier DQ view. Keyed by
// carrier+account together (not account alone): several carriers' exports
// have no account column at all and every one of their rows falls back to
// the literal "UNSPECIFIED" placeholder (see parseWorkbook.ts) — merging
// those across unrelated carriers would produce a meaningless combined
// bucket, same reasoning as crossCarrierAccountBreakdown in analyze.ts.
// Only accounts with at least one DQ are included, ranked by DQ count,
// capped to topN so a carrier with dozens of lanes doesn't blow out the
// dashboard.
export function accountDqRanked(data: CarrierActivityData, topN = 12): AccountDqRow[] {
  const map = new Map<string, { carrier: string; account: string; records: DriverRecord[] }>();
  Object.keys(data).forEach((carrier) => {
    data[carrier].records.forEach((r) => {
      const key = `${carrier} ${r.account}`;
      if (!map.has(key)) map.set(key, { carrier, account: r.account, records: [] });
      map.get(key)!.records.push(r);
    });
  });
  return Array.from(map.values())
    .map(({ carrier, account, records }) => {
      const counts = carrierTotals(records);
      const rate = hireRate(counts);
      return {
        carrier,
        account,
        counts,
        dqRate: rate !== null ? 1 - rate : null,
        dqReasons: dqReasonsForRecords(records),
      };
    })
    .filter((r) => r.counts.dq > 0)
    .sort((a, b) => b.counts.dq - a.counts.dq)
    .slice(0, topN);
}

// --- Most successful accounts (mirror of accountDqRanked, ranked by hires) ---

export interface AccountSuccessRow {
  carrier: string;
  account: string;
  counts: StatusCounts;
  hireRate: number | null;
}

// Answers "which account/lane is actually converting" — the positive mirror
// of accountDqRanked. Same carrier+account keying (see accountDqRanked for
// why: several carriers have no account column and would otherwise collapse
// into one meaningless "UNSPECIFIED" bucket across carriers). Requires a
// minimum submission count so a single-lucky-hire lane with 1 submission
// doesn't outrank real volume; ranked by hire count first (most successful
// in absolute terms), hire rate as tiebreaker.
const MIN_SUBMISSIONS_FOR_SUCCESS = 5;

export function accountSuccessRanked(data: CarrierActivityData, topN = 12): AccountSuccessRow[] {
  const map = new Map<string, { carrier: string; account: string; records: DriverRecord[] }>();
  Object.keys(data).forEach((carrier) => {
    data[carrier].records.forEach((r) => {
      const key = `${carrier} ${r.account}`;
      if (!map.has(key)) map.set(key, { carrier, account: r.account, records: [] });
      map.get(key)!.records.push(r);
    });
  });
  return Array.from(map.values())
    .map(({ carrier, account, records }) => {
      const counts = carrierTotals(records);
      return { carrier, account, counts, hireRate: hireRate(counts) };
    })
    .filter((r) => r.counts.total >= MIN_SUBMISSIONS_FOR_SUCCESS && r.counts.hired > 0)
    .sort((a, b) => b.counts.hired - a.counts.hired || (b.hireRate ?? 0) - (a.hireRate ?? 0))
    .slice(0, topN);
}

// --- Most-hired states (best-effort, derived from account names) -------------

export interface StateCarrierHires {
  carrier: string;
  hired: number;
}

export interface StateHireRow {
  state: string;
  counts: StatusCounts;
  hireRate: number | null;
  /** Which carriers those hires came from in this state, most-hires first. */
  byCarrier: StateCarrierHires[];
}

// Answers "which state are we actually hiring in" — same best-effort state
// extraction as recruiterPerformance/buildKeyInsights (see statesFromAccount):
// DriverRecord has no real state field, so this scans account names for USPS
// state codes. A record whose account names multiple states (e.g. "TX/OK/LA
// Regional") counts toward every state it names, not just one — same
// fan-out precedent as recruiterPerformance's byState map. Ranked by hire
// count so it reads as "where the wins are coming from", not just volume.
export function stateHireRanked(data: CarrierActivityData, topN = 15): StateHireRow[] {
  const map = new Map<string, { counts: StatusCounts; byCarrier: Map<string, number> }>();
  Object.keys(data).forEach((carrier) => {
    data[carrier].records.forEach((r) => {
      const states = statesFromAccount(r.account);
      states.forEach((s) => {
        if (!map.has(s)) map.set(s, { counts: { active: 0, dq: 0, hired: 0, total: 0 }, byCarrier: new Map() });
        const entry = map.get(s)!;
        entry.counts.total += 1;
        if (r.status === "Active") entry.counts.active += 1;
        else if (r.status === "DQ") entry.counts.dq += 1;
        else if (r.status === "Hired") {
          entry.counts.hired += 1;
          entry.byCarrier.set(carrier, (entry.byCarrier.get(carrier) ?? 0) + 1);
        }
      });
    });
  });
  return Array.from(map.entries())
    .map(([state, { counts, byCarrier }]) => ({
      state,
      counts,
      hireRate: hireRate(counts),
      byCarrier: Array.from(byCarrier.entries())
        .map(([carrier, hired]) => ({ carrier, hired }))
        .sort((a, b) => b.hired - a.hired),
    }))
    .filter((r) => r.counts.hired > 0)
    .sort((a, b) => b.counts.hired - a.counts.hired || (b.hireRate ?? 0) - (a.hireRate ?? 0))
    .slice(0, topN);
}

// --- Recruiter DQ diagnostic ---------------------------------------------------

export interface RecruiterDqRow {
  recruiter: string;
  counts: StatusCounts;
  dqRate: number | null;
  dqReasons: DqReasonRow[];
  /** How many of this recruiter's records carry a recordDate — see note below. */
  datedCount: number;
}

const MIN_RESOLVED_FOR_RECRUITER_DQ = 3;

// Per-recruiter mirror of accountDqRanked — answers "which recruiter has a
// rejection problem, and why", ranked worst-DQ-rate first, so a pattern
// caught in one recruiter's data can be checked against the rest of the
// roster. Deliberately NOT filtered to a trailing 6-month window: recordDate
// is missing on roughly half of all carriers' exports (see DriverRecord),
// so date-gating would silently drop half of most recruiters' history and
// make the ranking meaningless. `datedCount` is surfaced instead so the
// caller can show how much of each recruiter's total is actually dated.
// Requires a minimum number of decided (hired+dq) outcomes so a recruiter
// with a single DQ doesn't rank as "100% DQ".
export function recruiterDqRanked(data: CarrierActivityData, topN = 15): RecruiterDqRow[] {
  const map = new Map<string, DriverRecord[]>();
  Object.values(data).forEach((entry) => {
    entry.records.forEach((r) => {
      if (!r.recruiter) return;
      if (!map.has(r.recruiter)) map.set(r.recruiter, []);
      map.get(r.recruiter)!.push(r);
    });
  });
  return Array.from(map.entries())
    .map(([recruiter, records]) => {
      const counts = carrierTotals(records);
      const rate = hireRate(counts);
      return {
        recruiter,
        counts,
        dqRate: rate !== null ? 1 - rate : null,
        dqReasons: dqReasonsForRecords(records),
        datedCount: records.filter((r) => r.recordDate).length,
      };
    })
    .filter((r) => r.counts.hired + r.counts.dq >= MIN_RESOLVED_FOR_RECRUITER_DQ)
    .sort((a, b) => (b.dqRate ?? -1) - (a.dqRate ?? -1) || b.counts.dq - a.counts.dq)
    .slice(0, topN);
}

// --- Key insights -------------------------------------------------------------
// Every line here is derived directly from the same rows the tables/charts
// render — no synthetic period-over-period comparisons, since the data model
// only ever holds the latest snapshot per carrier.

const MIN_RESOLVED_FOR_INSIGHT = 3;

export function buildKeyInsights(data: CarrierActivityData, carrierRows: CarrierVolumeRow[]): string[] {
  const insights: string[] = [];
  const totals = overallTotals(data);

  if (carrierRows.length > 0 && totals.totalSubmissions > 0) {
    const top = carrierRows[0];
    const share = Math.round((top.counts.total / totals.totalSubmissions) * 100);
    insights.push(`${top.carrier} leads submission volume with ${top.counts.total} drivers (${share}% of all activity).`);
  }

  const overallReasons = overallDqReasons(data);
  if (overallReasons.length > 0 && totals.totalDq > 0) {
    const top = overallReasons[0];
    const share = Math.round((top.count / totals.totalDq) * 100);
    insights.push(`"${top.label}" is the most common rejection reason, accounting for ${top.count} of ${totals.totalDq} DQs (${share}%).`);
  }

  const dqRatedCarriers = carrierRows.filter((r) => r.counts.hired + r.counts.dq >= MIN_RESOLVED_FOR_INSIGHT && r.dqRate !== null);
  if (dqRatedCarriers.length > 0) {
    const worst = [...dqRatedCarriers].sort((a, b) => (b.dqRate as number) - (a.dqRate as number))[0];
    const worstTopReason = worst.dqReasons[0];
    insights.push(
      `${worst.carrier} has the highest rejection rate at ${Math.round((worst.dqRate as number) * 100)}%${
        worstTopReason ? `, most often for "${worstTopReason.label}" (${worstTopReason.count})` : ""
      }.`
    );
  }

  const accountRows = accountBreakdown(Object.values(data).flatMap((e) => e.records)).filter((r) => r.counts.hired > 0);
  if (accountRows.length > 0 && totals.totalHires > 0) {
    const topAcct = accountRows.sort((a, b) => b.counts.hired - a.counts.hired)[0];
    const share = Math.round((topAcct.counts.hired / totals.totalHires) * 100);
    insights.push(`"${topAcct.key}" accounts for ${topAcct.counts.hired} hires (${share}% of all hires) — the single biggest hiring account.`);
  }

  const stateTotals = new Map<string, number>();
  Object.values(data).forEach((entry) =>
    entry.records.forEach((r) => statesFromAccount(r.account).forEach((s) => stateTotals.set(s, (stateTotals.get(s) ?? 0) + 1)))
  );
  if (stateTotals.size > 0) {
    const [topState, topStateCount] = Array.from(stateTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    insights.push(`${topState} shows the most account activity (${topStateCount} submissions) among states detected in account names.`);
  }

  return insights;
}
