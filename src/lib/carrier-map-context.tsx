"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CARRIERS } from "@/lib/carriers/data";
import type { CarrierId, PersistedAssignments, PersistedRecruiterAssignments } from "@/lib/carriers/types";
import { useAssignments } from "@/lib/hooks/useAssignments";
import { useRecruiterAssignments } from "@/lib/hooks/useRecruiterAssignments";
import { useRecruiters } from "@/lib/hooks/useRecruiters";
import { buildRecruiterColorScale } from "@/lib/recruiters";

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
}

const CarrierMapContext = createContext<CarrierMapContextValue | null>(null);

export function CarrierMapProvider({ children }: { children: ReactNode }) {
  const [currentCarrier, setCurrentCarrier] = useState<CarrierId>("swift");
  const [currentCat, setCurrentCat] = useState<string>(CARRIERS.swift.cats[0]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [strategyMode, setStrategyMode] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("carrier");
  const [recruiterFilter, setRecruiterFilter] = useState("");

  const [assignments, setAssignments] = useAssignments();
  const [recruiters, setRecruiters] = useRecruiters();
  const [recruiterAssignments, setRecruiterAssignments] = useRecruiterAssignments();

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
      setRecruiterFilter((prev) => (prev === name ? "" : prev));
    },
    [setRecruiters, setRecruiterAssignments]
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
  };

  return <CarrierMapContext.Provider value={value}>{children}</CarrierMapContext.Provider>;
}

export function useCarrierMap(): CarrierMapContextValue {
  const ctx = useContext(CarrierMapContext);
  if (!ctx) throw new Error("useCarrierMap must be used within a CarrierMapProvider");
  return ctx;
}
