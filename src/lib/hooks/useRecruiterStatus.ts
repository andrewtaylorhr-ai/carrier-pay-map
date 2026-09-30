"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiterStatus } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiterStatus";

export function useRecruiterStatus() {
  return useLocalStorageState<PersistedRecruiterStatus>(KEY, {});
}
