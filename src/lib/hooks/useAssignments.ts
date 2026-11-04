"use client";

import { useLocalStorageState } from "./useLocalStorage";
import { CARRIERS } from "@/lib/carriers/data";
import type { CarrierId, PersistedAssignments } from "@/lib/carriers/types";

const KEY = "cdlPayMapAssignments";

// A state used to hold exactly one carrier (a plain CarrierId string); it
// now holds a list so managers can put several carriers on one state. Old
// single-carrier saves upgrade to a one-item list, and ids for carriers that
// no longer exist are dropped.
function migrate(raw: unknown): PersistedAssignments {
  if (raw == null || typeof raw !== "object") return {};
  const out: PersistedAssignments = {};
  for (const [state, val] of Object.entries(raw as Record<string, unknown>)) {
    const arr = (typeof val === "string" ? [val] : Array.isArray(val) ? val : []).filter(
      (id): id is CarrierId => typeof id === "string" && id in CARRIERS
    );
    if (arr.length) out[state] = arr;
  }
  return out;
}

export function useAssignments() {
  return useLocalStorageState<PersistedAssignments>(KEY, {}, { migrate });
}
