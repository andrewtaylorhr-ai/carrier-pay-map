"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiterPlans } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiterPlans";

export function useRecruiterPlans() {
  return useLocalStorageState<PersistedRecruiterPlans>(KEY, {});
}
