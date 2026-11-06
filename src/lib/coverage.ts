// Account coverage per state for the Team Overview map: every open account
// hiring in a state, and which of that state's recruiters (if any) has it
// ticked. An account counts as assigned in a state only when a recruiter who
// is assigned that state has ticked it, since accounts can span many states.
import { ALL_ACCOUNTS } from "@/lib/carriers/accounts";
import { ALL_STATES, CARRIER_ORDER } from "@/lib/carriers/data";
import type {
  Account,
  CarrierId,
  PersistedAssignments,
  PersistedRecruiterAccounts,
  PersistedRecruiterAssignments,
} from "@/lib/carriers/types";

export interface CoverageAccount {
  account: Account;
  recruiters: string[]; // who has it ticked in this state; empty = not assigned
}

export interface CarrierCoverage {
  carrier: CarrierId;
  onState: boolean; // carrier is assigned to the state (Strategy assignment)
  accounts: CoverageAccount[];
  assigned: number;
}

export interface StateCoverage {
  state: string;
  recruiters: string[];
  carriers: CarrierCoverage[]; // only carriers with open accounts here, plus any assigned with none
  total: number;
  assigned: number;
}

export type CoverageLevel = "none" | "partial" | "full" | "empty";

export function coverageLevel(c: StateCoverage): CoverageLevel {
  if (!c.total) return "empty";
  if (!c.assigned) return "none";
  return c.assigned === c.total ? "full" : "partial";
}

export const COVERAGE_COLOR: Record<CoverageLevel, string> = {
  full: "#16a34a",
  partial: "#f59e0b",
  none: "#e5484d",
  empty: "#9aa0ad",
};

export const COVERAGE_LABEL: Record<CoverageLevel, string> = {
  full: "All accounts assigned",
  partial: "Some accounts not assigned",
  none: "No accounts assigned",
  empty: "No open accounts",
};

export function buildCoverage(
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments,
  recruiterAccounts: PersistedRecruiterAccounts,
  carriers: CarrierId[] = CARRIER_ORDER
): Record<string, StateCoverage> {
  const ticked = new Map<string, Set<string>>();
  for (const [r, ids] of Object.entries(recruiterAccounts)) ticked.set(r, new Set(ids));

  const out: Record<string, StateCoverage> = {};
  for (const state of ALL_STATES) {
    const recruiters = recruiterAssignments[state] || [];
    const on = assignments[state] || [];
    const list: CarrierCoverage[] = [];
    let total = 0;
    let assigned = 0;
    for (const carrier of carriers) {
      const accounts: CoverageAccount[] = ALL_ACCOUNTS.filter((a) => a.carrier === carrier && a.states.includes(state)).map(
        (account) => ({ account, recruiters: recruiters.filter((r) => ticked.get(r)?.has(account.id)) })
      );
      if (!accounts.length && !on.includes(carrier)) continue;
      const n = accounts.filter((a) => a.recruiters.length).length;
      list.push({ carrier, onState: on.includes(carrier), accounts, assigned: n });
      total += accounts.length;
      assigned += n;
    }
    out[state] = { state, recruiters, carriers: list, total, assigned };
  }
  return out;
}
