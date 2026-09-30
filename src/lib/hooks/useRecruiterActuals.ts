"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiterActuals } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiterActuals";

export function useRecruiterActuals() {
  return useLocalStorageState<PersistedRecruiterActuals>(KEY, {});
}
