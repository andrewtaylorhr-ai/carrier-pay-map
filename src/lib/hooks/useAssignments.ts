"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedAssignments } from "@/lib/carriers/types";

const KEY = "cdlPayMapAssignments";

export function useAssignments() {
  return useLocalStorageState<PersistedAssignments>(KEY, {});
}
