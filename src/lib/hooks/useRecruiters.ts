"use client";

import { DEFAULT_RECRUITERS } from "@/lib/recruiters";
import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiters } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiters";

export function useRecruiters() {
  return useLocalStorageState<PersistedRecruiters>(KEY, DEFAULT_RECRUITERS.slice(), {
    migrate: (raw) => (Array.isArray(raw) && raw.length ? (raw as string[]) : DEFAULT_RECRUITERS.slice()),
  });
}
