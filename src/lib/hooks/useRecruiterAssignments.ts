"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiterAssignments } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiterAssignments";

// Reimplements the legacy migration from the original HTML (lines ~649-653):
// old data stored a single recruiter name as a plain string per state;
// newer data stores an array (a state can be shared by multiple recruiters).
// Any browser that still has old-format data gets upgraded transparently.
function migrate(raw: unknown): PersistedRecruiterAssignments {
  if (raw == null || typeof raw !== "object") return {};
  const out: PersistedRecruiterAssignments = {};
  for (const [state, val] of Object.entries(raw as Record<string, unknown>)) {
    let arr: string[];
    if (typeof val === "string") arr = [val];
    else if (Array.isArray(val)) arr = val as string[];
    else continue;
    if (arr.length) out[state] = arr;
  }
  return out;
}

export function useRecruiterAssignments() {
  return useLocalStorageState<PersistedRecruiterAssignments>(KEY, {}, { migrate });
}
