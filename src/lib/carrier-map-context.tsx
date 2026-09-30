"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CARRIERS } from "@/lib/carriers/data";
import type {
  CarrierId,
  PersistedAssignments,
  PersistedRecruiterActuals,
  PersistedRecruiterAssignments,
  PersistedRecruiterPlans,
  PersistedRecruiterTeams,
  RecruiterActual,
  RecruiterPlan,
  RecruiterTeam,
} from "@/lib/carriers/types";
import { useAssignments } from "@/lib/hooks/useAssignments";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { useRecruiterActuals } from "@/lib/hooks/useRecruiterActuals";
import { useRecruiterAssignments } from "@/lib/hooks/useRecruiterAssignments";
import { useRecruiters } from "@/lib/hooks/useRecruiters";
import { useRecruiterPlans } from "@/lib/hooks/useRecruiterPlans";
import { useRecruiterTeams } from "@/lib/hooks/useRecruiterTeams";
import { buildRecruiterColorScale } from "@/lib/recruiters";

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

export type ColorMode = "carrier" | "recruiter";

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

  // persisted: carrier assignments (Strategy mode)
  assignments: PersistedAssignments;
  assignCarrierToState: (state: string, carrierId: CarrierId | null) => void;

  // persisted: recruiter roster
  recruiters: string[];
  addRecruiter: (name: string) => string | null; // returns error message, or null on success
  removeRecruiter: (name: string) => void;
  recruiterColor: (name: string) => string;

  // persisted: recruiter -> states assignments
  recruiterAssignments: PersistedRecruiterAssignments;
  toggleRecruiterOnState: (state: string, recruiter: string) => void;

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

  const [assignments, setAssignments] = useAssignments();
  const [recruiters, setRecruiters] = useRecruiters();
  const [recruiterAssignments, setRecruiterAssignments] = useRecruiterAssignments();
  const [recruiterPlans, setRecruiterPlans] = useRecruiterPlans();
  const [recruiterTeams, setRecruiterTeams] = useRecruiterTeams();
  const [recruiterActuals, setRecruiterActuals] = useRecruiterActuals();

  const setCarrier = useCallback((id: CarrierId) => {
    setCurrentCarrier(id);
    setCurrentCat(CARRIERS[id].cats[0]);
    setSelectedState(null);
  }, []);

  const setCat = useCallback((cat: string) => {
    setCurrentCat(cat);
    setSelectedState(null);
  }, []);

  const assignCarrierToState = useCallback(
    (state: string, carrierId: CarrierId | null) => {
      setAssignments((prev) => {
        const next = { ...prev };
        if (carrierId) next[state] = carrierId;
        else delete next[state];
        return next;
      });
    },
    [setAssignments]
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
      setRecruiterFilter((prev) => (prev === name ? "" : prev));
      setAssignModeRecruiter((prev) => (prev === name ? null : prev));
    },
    [setRecruiters, setRecruiterAssignments, setRecruiterPlans, setRecruiterTeams, setRecruiterActuals]
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
    assignCarrierToState,
    recruiters,
    addRecruiter,
    removeRecruiter,
    recruiterColor,
    recruiterAssignments,
    toggleRecruiterOnState,
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
  };

  return <CarrierMapContext.Provider value={value}>{children}</CarrierMapContext.Provider>;
}

export function useCarrierMap(): CarrierMapContextValue {
  const ctx = useContext(CarrierMapContext);
  if (!ctx) throw new Error("useCarrierMap must be used within a CarrierMapProvider");
  return ctx;
}
