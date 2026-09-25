"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { HirePerformanceRecord } from "@/lib/activity/hirePerformance";

const KEY = "cdlPayMapHirePerformance";

export function useHirePerformance() {
  return useLocalStorageState<HirePerformanceRecord[]>(KEY, []);
}
