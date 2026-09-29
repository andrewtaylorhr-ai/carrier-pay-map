"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiterTeams } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiterTeams";

export function useRecruiterTeams() {
  return useLocalStorageState<PersistedRecruiterTeams>(KEY, {});
}
