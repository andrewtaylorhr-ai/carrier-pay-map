"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { MonthlyReport, PersistedMonthlyReports } from "@/lib/carriers/types";

const KEY = "cdlPayMapMonthlyReports";

// Seeded with the real "Class A Recruiting - August 2026 Performance
// Report" the user provided (submission/DQ/hire counts per carrier, weekly
// submission volume, Indeed spend, etc). Everything derivable from these
// numbers (Hire %, Leads→Hire %, Avg Submissions/Recruiter, Avg
// Hires/Recruiter, Best Carrier, Average CPL, % of Total Submissions per
// carrier) is computed live in the UI, never duplicated here — matches the
// rest of this app's "derive from real data" convention.
const AUGUST_2026: MonthlyReport = {
  totalLeads: 11366,
  totalDqp: 147,
  dqFromDqp: 75,
  activeRecruiters: 32,
  totalIndeedSpend: 53580,
  indeedAccountsTotal: 34,
  indeedAccountsActive: 11,
  averageCpl: 5.22,
  weeklySubmissions: [
    { label: "8/3-8/8", submissions: 509 },
    { label: "8/10-8/15", submissions: 456 },
    { label: "8/17-8/22", submissions: 363 },
    { label: "8/24-8/29", submissions: 294 },
    { label: "8/31", submissions: 44 },
  ],
  carriers: [
    { carrier: "Swift", submissions: 1080, dqNoResponse: 1030, hired: 50, notes: "31 Hire From Jul" },
    { carrier: "Pam Transportation", submissions: 174, dqNoResponse: 166, hired: 8, notes: "18 Hire to Sep" },
    { carrier: "CR England", submissions: 66, dqNoResponse: 62, hired: 4, notes: "35 Process to Sep" },
    { carrier: "JB Hunt", submissions: 73, dqNoResponse: 70, hired: 3, notes: "" },
    { carrier: "M.A.S.T", submissions: 8, dqNoResponse: 5, hired: 3, notes: "" },
    { carrier: "Trans Am", submissions: 21, dqNoResponse: 19, hired: 2, notes: "" },
    { carrier: "Day & Ross", submissions: 34, dqNoResponse: 33, hired: 1, notes: "" },
    { carrier: "US Xpress", submissions: 46, dqNoResponse: 45, hired: 1, notes: "" },
    { carrier: "Bay & Bay", submissions: 3, dqNoResponse: 3, hired: 0, notes: "" },
    { carrier: "Barr-Nunn", submissions: 4, dqNoResponse: 4, hired: 0, notes: "" },
    { carrier: "Epes", submissions: 8, dqNoResponse: 8, hired: 0, notes: "" },
    { carrier: "Hub Group", submissions: 121, dqNoResponse: 121, hired: 0, notes: "" },
    { carrier: "Inland Xpress", submissions: 3, dqNoResponse: 3, hired: 0, notes: "" },
    { carrier: "Koch", submissions: 2, dqNoResponse: 2, hired: 0, notes: "" },
    { carrier: "National Carriers", submissions: 2, dqNoResponse: 2, hired: 0, notes: "" },
    { carrier: "NFI", submissions: 5, dqNoResponse: 5, hired: 0, notes: "" },
    { carrier: "Orozco Trucking, Inc", submissions: 5, dqNoResponse: 5, hired: 0, notes: "" },
    { carrier: "P&S", submissions: 3, dqNoResponse: 3, hired: 0, notes: "" },
    { carrier: "Sisbro", submissions: 1, dqNoResponse: 1, hired: 0, notes: "" },
    { carrier: "TA Dedicated", submissions: 2, dqNoResponse: 2, hired: 0, notes: "" },
    { carrier: "Transco Lines, Inc.", submissions: 5, dqNoResponse: 5, hired: 0, notes: "" },
  ],
  // No per-state or DQ-reason breakdown was provided for August — left
  // empty rather than fabricated, matching this app's honest-data convention.
  stateBreakdown: [],
  dqReasons: [],
};

const DEFAULT_MONTHLY_REPORTS: PersistedMonthlyReports = {
  "2026-08": AUGUST_2026,
};

export function useMonthlyReports() {
  return useLocalStorageState<PersistedMonthlyReports>(KEY, DEFAULT_MONTHLY_REPORTS);
}
