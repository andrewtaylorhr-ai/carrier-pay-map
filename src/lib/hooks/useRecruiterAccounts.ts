"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { PersistedRecruiterAccounts } from "@/lib/carriers/types";

const KEY = "cdlPayMapRecruiterAccounts";

function migrate(raw: unknown): PersistedRecruiterAccounts {
  if (raw == null || typeof raw !== "object") return {};
  const out: PersistedRecruiterAccounts = {};
  for (const [name, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      const ids = val.filter((v): v is string => typeof v === "string");
      if (ids.length) out[name] = ids;
    }
  }
  return out;
}

// Recruiter -> carrier account ids (Account.id) they're assigned to work.
export function useRecruiterAccounts() {
  return useLocalStorageState<PersistedRecruiterAccounts>(KEY, {}, { migrate });
}
