"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CARRIERS } from "@/lib/carriers/data";
import type {
  CarrierId,
  MonthlyReport,
  PersistedAssignments,
  PersistedMonthlyReports,
  PersistedRecruiterAccounts,
  PersistedRecruiterActuals,
  PersistedRecruiterAssignments,
  PersistedRecruiterPlans,
  PersistedRecruiterStatus,
  PersistedRecruiterTeams,
  RecruiterActual,
  RecruiterPlan,
  RecruiterStatus,
  RecruiterTeam,
} from "@/lib/carriers/types";
import { EMPTY_MONTHLY_REPORT } from "@/lib/carriers/types";
import { useAssignments } from "@/lib/hooks/useAssignments";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { useMonthlyReports } from "@/lib/hooks/useMonthlyReports";
import { useRecruiterAccounts } from "@/lib/hooks/useRecruiterAccounts";
import { useRecruiterActuals } from "@/lib/hooks/useRecruiterActuals";
import { useRecruiterAssignments } from "@/lib/hooks/useRecruiterAssignments";
import { useRecruiters } from "@/lib/hooks/useRecruiters";
import { useRecruiterPlans } from "@/lib/hooks/useRecruiterPlans";
import { useRecruiterStatus } from "@/lib/hooks/useRecruiterStatus";
import { useRecruiterTeams } from "@/lib/hooks/useRecruiterTeams";
import { buildRecruiterColorScale } from "@/lib/recruiters";
import { type PersistedTrainees, type Trainee, todayISO } from "@/lib/trainees";

export type TeamFilter = "all" | RecruiterTeam;

export const EMPTY_RECRUITER_PLAN: RecruiterPlan = {
  targetSubmissions: null,
  targetHires: null,
  carriers: [],
  notes: "",
};

export const EMPTY_RECRUITER_ACTUAL: RecruiterActual = {
  submissions: null,
  hires: null,
};

export type ColorMode = "carrier" | "recruiter" | "hires";

interface CarrierMapContextValue {
  // toolbar / view state
  currentCarrier: CarrierId;
  setCarrier: (id: CarrierId) => void;
  currentCat: string;
  setCat: (cat: string) => void;
  selectedState: string | null;
  setSelectedState: (s: string | null) => void;
  strategyMode: boolean;
  setStrategyMode: (b: boolean) => void;
  colorMode: ColorMode;
  setColorMode: (m: ColorMode) => void;
  recruiterFilter: string;
  setRecruiterFilter: (r: string) => void;

  // persisted: carrier assignments (Strategy mode) — several carriers per state
  assignments: PersistedAssignments;
  toggleCarrierOnState: (state: string, carrierId: CarrierId) => void;

  // persisted: recruiter roster
  recruiters: string[];
  addRecruiter: (name: string) => string | null; // returns error message, or null on success
  removeRecruiter: (name: string) => void;
  // Offboarding: marks `from` as a former recruiter and moves their states and
  // ticked accounts to `to` (or leaves them unassigned when `to` is null).
  // Plans, actuals and team stay with `from` so their history is kept.
  handOverRecruiter: (from: string, to: string | null) => void;
  recruiterColor: (name: string) => string;

  // persisted: recruiter -> states assignments
  recruiterAssignments: PersistedRecruiterAssignments;
  toggleRecruiterOnState: (state: string, recruiter: string) => void;

  // persisted: recruiter -> carrier account ids (Strategy Builder checklist)
  recruiterAccounts: PersistedRecruiterAccounts;
  toggleRecruiterAccount: (recruiter: string, accountId: string) => void;
  // add (on=true) or remove (on=false) many accounts at once — "Select all"
  setRecruiterAccountsOn: (recruiter: string, accountIds: string[], on: boolean) => void;

  // map-click assign mode: while set, clicking a state on the map toggles
  // this recruiter on/off that state directly, instead of opening the detail
  // card — lets a whole territory be built up with a run of clicks.
  assignModeRecruiter: string | null;
  setAssignModeRecruiter: (r: string | null) => void;

  // persisted: recruiter Strategy Plan (targets / carrier tags / notes)
  recruiterPlans: PersistedRecruiterPlans;
  getRecruiterPlan: (name: string) => RecruiterPlan;
  updateRecruiterPlan: (name: string, patch: Partial<RecruiterPlan>) => void;

  // persisted: recruiter's actual submissions/hires per calendar month,
  // entered by hand — feeds the "Actual" columns next to each recruiter's
  // (single, ongoing) target, in MonthlyTargetActualTable and /reports.
  recruiterActuals: PersistedRecruiterActuals;
  getRecruiterActual: (name: string, month: string) => RecruiterActual;
  updateRecruiterActual: (name: string, month: string, patch: Partial<RecruiterActual>) => void;

  // persisted: recruiter -> outsourced team (Uzbek / Philippines). Missing
  // key means unassigned. Only used to filter the two recruiter-name lists
  // in the Recruiters panel — doesn't touch the map, states, or reports.
  recruiterTeams: PersistedRecruiterTeams;
  getRecruiterTeam: (name: string) => RecruiterTeam | null;
  setRecruiterTeam: (name: string, team: RecruiterTeam | null) => void;
  // persisted: last-selected team filter, so it survives a page refresh
  // instead of always resetting to "all".
  teamFilter: TeamFilter;
  setTeamFilter: (f: TeamFilter) => void;
  // persisted: whether former recruiters are listed in the sidebar and the
  // Team Overview tables. Hidden by default; Reports always shows them.
  showFormer: boolean;
  setShowFormer: (v: boolean) => void;

  // persisted: active vs. former/inactive recruiter. Missing key means
  // active. Former recruiters stay in the roster (history/assignments/plan
  // stay intact) but every recruiter-list UI sorts them to the end and
  // renders them in red — see compareRecruitersByStatus.
  recruiterStatus: PersistedRecruiterStatus;
  getRecruiterStatus: (name: string) => RecruiterStatus;
  setRecruiterStatus: (name: string, status: RecruiterStatus) => void;
  // Stable sort comparator (active before inactive, otherwise preserves
  // existing order) — pass to Array.prototype.sort in any component that
  // lists recruiter names, so "inactive sorted last" is consistent everywhere.
  compareRecruitersByStatus: (a: string, b: string) => number;

  // persisted: new-recruiter pipeline managed on the Controller page
  // (training -> quality control -> approved). Approving adds them to the
  // roster; they count as "new" until their first hire is recorded.
  trainees: PersistedTrainees;
  addTrainee: (name: string, team: RecruiterTeam | null, start: string) => string | null;
  updateTrainee: (name: string, patch: Partial<Trainee>) => void;
  removeTrainee: (name: string) => void;
  approveTrainee: (name: string) => string | null;
  isNewRecruiter: (name: string) => boolean;

  // persisted: company-wide Monthly Report (leads/DQP/Indeed spend + weekly
  // submissions + per-carrier breakdown), keyed by "YYYY-MM". Independent of
  // recruiterPlans/recruiterActuals (per-recruiter) and of CarrierId (the
  // 5-carrier map-assignment enum) — this report's carrier rows are
  // free-text since the real submission pipeline spans 20+ carriers.
  monthlyReports: PersistedMonthlyReports;
  getMonthlyReport: (month: string) => MonthlyReport;
  updateMonthlyReport: (month: string, patch: Partial<MonthlyReport>) => void;

  // which Monthly Report month is currently active on the /reports page —
  // lifted to context (not local component state) so the map's "Hires"
  // color mode can read the same month's stateBreakdown the user is
  // currently viewing/editing.
  reportsActiveMonth: string;
  setReportsActiveMonth: (month: string) => void;
}

const CarrierMapContext = createContext<CarrierMapContextValue | null>(null);

export function CarrierMapProvider({ children }: { children: ReactNode }) {
  const [currentCarrier, setCurrentCarrier] = useState<CarrierId>("swift");
  const [currentCat, setCurrentCat] = useState<string>(CARRIERS.swift.cats[0]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [strategyMode, setStrategyMode] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>("carrier");
  const [recruiterFilter, setRecruiterFilter] = useState("");

  const [assignModeRecruiter, setAssignModeRecruiter] = useState<string | null>(null);

  const [teamFilter, setTeamFilter] = useLocalStorageState<TeamFilter>("cpm_teamFilter", "all");
  const [showFormer, setShowFormer] = useLocalStorageState<boolean>("cpm_showFormer", false);
  const [trainees, setTrainees] = useLocalStorageState<PersistedTrainees>("cdlPayMapTrainees", {});

  const [assignments, setAssignments] = useAssignments();
  const [recruiters, setRecruiters] = useRecruiters();
  const [recruiterAssignments, setRecruiterAssignments] = useRecruiterAssignments();
  const [recruiterAccounts, setRecruiterAccountsMap] = useRecruiterAccounts();
  const [recruiterPlans, setRecruiterPlans] = useRecruiterPlans();
  const [recruiterTeams, setRecruiterTeams] = useRecruiterTeams();
  const [recruiterActuals, setRecruiterActuals] = useRecruiterActuals();
  const [recruiterStatus, setRecruiterStatusMap] = useRecruiterStatus();
  const [monthlyReports, setMonthlyReports] = useMonthlyReports();
  const [reportsActiveMonth, setReportsActiveMonth] = useState<string>("");

  const setCarrier = useCallback((id: CarrierId) => {
    setCurrentCarrier(id);
    setCurrentCat(CARRIERS[id].cats[0]);
    setSelectedState(null);
  }, []);

  const setCat = useCallback((cat: string) => {
    setCurrentCat(cat);
    setSelectedState(null);
  }, []);

  const toggleCarrierOnState = useCallback(
    (state: string, carrierId: CarrierId) => {
      setAssignments((prev) => {
        const arr = prev[state] ? prev[state].slice() : [];
        const idx = arr.indexOf(carrierId);
        if (idx === -1) arr.push(carrierId);
        else arr.splice(idx, 1);
        const next = { ...prev };
        if (arr.length) next[state] = arr;
        else delete next[state];
        return next;
      });
    },
    [setAssignments]
  );

  const toggleRecruiterAccount = useCallback(
    (recruiter: string, accountId: string) => {
      setRecruiterAccountsMap((prev) => {
        const arr = prev[recruiter] ? prev[recruiter].slice() : [];
        const idx = arr.indexOf(accountId);
        if (idx === -1) arr.push(accountId);
        else arr.splice(idx, 1);
        const next = { ...prev };
        if (arr.length) next[recruiter] = arr;
        else delete next[recruiter];
        return next;
      });
    },
    [setRecruiterAccountsMap]
  );

  const setRecruiterAccountsOn = useCallback(
    (recruiter: string, accountIds: string[], on: boolean) => {
      setRecruiterAccountsMap((prev) => {
        const set = new Set(prev[recruiter] || []);
        accountIds.forEach((id) => (on ? set.add(id) : set.delete(id)));
        const next = { ...prev };
        if (set.size) next[recruiter] = Array.from(set);
        else delete next[recruiter];
        return next;
      });
    },
    [setRecruiterAccountsMap]
  );

  const recruiterColor = useMemo(() => buildRecruiterColorScale(recruiters), [recruiters]);

  const addRecruiter = useCallback(
    (name: string): string | null => {
      const trimmed = (name || "").trim();
      if (!trimmed) return "Enter a recruiter name.";
      if (recruiters.some((r) => r.toLowerCase() === trimmed.toLowerCase())) return "That recruiter already exists.";
      setRecruiters((prev) => [...prev, trimmed]);
      return null;
    },
    [recruiters, setRecruiters]
  );

  const removeRecruiter = useCallback(
    (name: string) => {
      setRecruiters((prev) => prev.filter((r) => r !== name));
      setRecruiterAssignments((prev) => {
        const next: PersistedRecruiterAssignments = {};
        for (const [state, arr] of Object.entries(prev)) {
          const filtered = arr.filter((r) => r !== name);
          if (filtered.length) next[state] = filtered;
        }
        return next;
      });
      setRecruiterAccountsMap((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setRecruiterPlans((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setRecruiterTeams((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setRecruiterActuals((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setRecruiterStatusMap((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setRecruiterFilter((prev) => (prev === name ? "" : prev));
      setAssignModeRecruiter((prev) => (prev === name ? null : prev));
    },
    [
      setRecruiters,
      setRecruiterAssignments,
      setRecruiterAccountsMap,
      setRecruiterPlans,
      setRecruiterTeams,
      setRecruiterActuals,
      setRecruiterStatusMap,
    ]
  );

  const getRecruiterTeam = useCallback(
    (name: string): RecruiterTeam | null => recruiterTeams[name] ?? null,
    [recruiterTeams]
  );

  const setRecruiterTeam = useCallback(
    (name: string, team: RecruiterTeam | null) => {
      setRecruiterTeams((prev) => {
        if (!team) {
          if (!(name in prev)) return prev;
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return { ...prev, [name]: team };
      });
    },
    [setRecruiterTeams]
  );

  const getRecruiterPlan = useCallback(
    (name: string): RecruiterPlan => recruiterPlans[name] ?? EMPTY_RECRUITER_PLAN,
    [recruiterPlans]
  );

  const updateRecruiterPlan = useCallback(
    (name: string, patch: Partial<RecruiterPlan>) => {
      setRecruiterPlans((prev) => ({
        ...prev,
        [name]: { ...EMPTY_RECRUITER_PLAN, ...prev[name], ...patch },
      }));
    },
    [setRecruiterPlans]
  );

  const getRecruiterActual = useCallback(
    (name: string, month: string): RecruiterActual => recruiterActuals[name]?.[month] ?? EMPTY_RECRUITER_ACTUAL,
    [recruiterActuals]
  );

  const updateRecruiterActual = useCallback(
    (name: string, month: string, patch: Partial<RecruiterActual>) => {
      setRecruiterActuals((prev) => {
        const prevForName = prev[name] ?? {};
        const prevForMonth = prevForName[month] ?? EMPTY_RECRUITER_ACTUAL;
        return {
          ...prev,
          [name]: { ...prevForName, [month]: { ...prevForMonth, ...patch } },
        };
      });
    },
    [setRecruiterActuals]
  );

  const getRecruiterStatus = useCallback(
    (name: string): RecruiterStatus => recruiterStatus[name] ?? "active",
    [recruiterStatus]
  );

  const setRecruiterStatus = useCallback(
    (name: string, status: RecruiterStatus) => {
      setRecruiterStatusMap((prev) => {
        if (status === "active") {
          if (!(name in prev)) return prev;
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return { ...prev, [name]: status };
      });
    },
    [setRecruiterStatusMap]
  );

  const compareRecruitersByStatus = useCallback(
    (a: string, b: string): number => {
      const aInactive = getRecruiterStatus(a) === "inactive";
      const bInactive = getRecruiterStatus(b) === "inactive";
      if (aInactive === bInactive) return 0;
      return aInactive ? 1 : -1;
    },
    [getRecruiterStatus]
  );

  const handOverRecruiter = useCallback(
    (from: string, to: string | null) => {
      setRecruiterAssignments((prev) => {
        const next: PersistedRecruiterAssignments = {};
        for (const [state, arr] of Object.entries(prev)) {
          const had = arr.includes(from);
          const filtered = arr.filter((r) => r !== from);
          if (had && to && !filtered.includes(to)) filtered.push(to);
          if (filtered.length) next[state] = filtered;
        }
        return next;
      });
      setRecruiterAccountsMap((prev) => {
        if (!(from in prev)) return prev;
        const next = { ...prev };
        if (to) next[to] = [...new Set([...(prev[to] ?? []), ...prev[from]])];
        delete next[from];
        return next;
      });
      setRecruiterStatus(from, "inactive");
      setRecruiterFilter((prev) => (prev === from ? "" : prev));
      setAssignModeRecruiter((prev) => (prev === from ? null : prev));
    },
    [setRecruiterAssignments, setRecruiterAccountsMap, setRecruiterStatus]
  );

  const getMonthlyReport = useCallback(
    // Merge (not just fall back) against EMPTY_MONTHLY_REPORT: reports saved
    // to localStorage before a schema field was added (e.g. stateBreakdown/
    // dqReasons) would otherwise come back with that field `undefined`,
    // crashing any table that calls .reduce()/.map() on it. updateMonthlyReport
    // already merges on write; this makes every read self-healing too.
    (month: string): MonthlyReport => ({ ...EMPTY_MONTHLY_REPORT, ...monthlyReports[month] }),
    [monthlyReports]
  );

  const updateMonthlyReport = useCallback(
    (month: string, patch: Partial<MonthlyReport>) => {
      setMonthlyReports((prev) => ({
        ...prev,
        [month]: { ...EMPTY_MONTHLY_REPORT, ...prev[month], ...patch },
      }));
    },
    [setMonthlyReports]
  );

  const toggleRecruiterOnState = useCallback(
    (state: string, recruiter: string) => {
      setRecruiterAssignments((prev) => {
        const arr = prev[state] ? prev[state].slice() : [];
        const idx = arr.indexOf(recruiter);
        if (idx === -1) arr.push(recruiter);
        else arr.splice(idx, 1);
        const next = { ...prev };
        if (arr.length) next[state] = arr;
        else delete next[state];
        return next;
      });
    },
    [setRecruiterAssignments]
  );

  const addTrainee = useCallback(
    (name: string, team: RecruiterTeam | null, start: string): string | null => {
      const trimmed = (name || "").trim();
      if (!trimmed) return "Enter a name.";
      const taken = (n: string) => n.toLowerCase() === trimmed.toLowerCase();
      if (Object.keys(trainees).some(taken)) return "That person is already on the list.";
      if (recruiters.some(taken)) return "That name is already a recruiter.";
      setTrainees((prev) => ({ ...prev, [trimmed]: { team, start, stage: "training" } }));
      return null;
    },
    [trainees, recruiters, setTrainees]
  );

  const updateTrainee = useCallback(
    (name: string, patch: Partial<Trainee>) =>
      setTrainees((prev) => (prev[name] ? { ...prev, [name]: { ...prev[name], ...patch } } : prev)),
    [setTrainees]
  );

  const removeTrainee = useCallback(
    (name: string) =>
      setTrainees((prev) => {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      }),
    [setTrainees]
  );

  const approveTrainee = useCallback(
    (name: string): string | null => {
      const t = trainees[name];
      if (!t) return "Not on the list.";
      if (!recruiters.includes(name)) {
        const problem = addRecruiter(name);
        if (problem) return problem;
      }
      if (t.team) setRecruiterTeam(name, t.team);
      updateTrainee(name, { stage: "approved", approvedAt: todayISO() });
      return null;
    },
    [trainees, recruiters, addRecruiter, setRecruiterTeam, updateTrainee]
  );

  const isNewRecruiter = useCallback(
    (name: string) => trainees[name]?.stage === "approved" && !trainees[name]?.firstHireAt,
    [trainees]
  );

  const value: CarrierMapContextValue = {
    currentCarrier,
    setCarrier,
    currentCat,
    setCat,
    selectedState,
    setSelectedState,
    strategyMode,
    setStrategyMode,
    colorMode,
    setColorMode,
    recruiterFilter,
    setRecruiterFilter,
    assignments,
    toggleCarrierOnState,
    recruiters,
    addRecruiter,
    removeRecruiter,
    handOverRecruiter,
    recruiterColor,
    recruiterAssignments,
    toggleRecruiterOnState,
    recruiterAccounts,
    toggleRecruiterAccount,
    setRecruiterAccountsOn,
    assignModeRecruiter,
    setAssignModeRecruiter,
    recruiterPlans,
    getRecruiterPlan,
    updateRecruiterPlan,
    recruiterActuals,
    getRecruiterActual,
    updateRecruiterActual,
    recruiterTeams,
    getRecruiterTeam,
    setRecruiterTeam,
    teamFilter,
    setTeamFilter,
    showFormer,
    setShowFormer,
    recruiterStatus,
    getRecruiterStatus,
    setRecruiterStatus,
    compareRecruitersByStatus,
    trainees,
    addTrainee,
    updateTrainee,
    removeTrainee,
    approveTrainee,
    isNewRecruiter,
    monthlyReports,
    getMonthlyReport,
    updateMonthlyReport,
    reportsActiveMonth,
    setReportsActiveMonth,
  };

  return <CarrierMapContext.Provider value={value}>{children}</CarrierMapContext.Provider>;
}

export function useCarrierMap(): CarrierMapContextValue {
  const ctx = useContext(CarrierMapContext);
  if (!ctx) throw new Error("useCarrierMap must be used within a CarrierMapProvider");
  return ctx;
}
