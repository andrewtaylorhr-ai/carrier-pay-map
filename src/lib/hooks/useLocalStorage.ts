"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SHARED_EVENT, SHARED_KEYS, cloudReady, getCloudState, saveShared, subscribeCloud } from "@/lib/cloud";

const SIGNED_OUT = getCloudState();

// Signed-in state of the shared database, for components that show it.
export function useCloud() {
  return useSyncExternalStore(subscribeCloud, getCloudState, () => SIGNED_OUT);
}

// Generic client-only localStorage-backed state. SSR-safe: starts from
// `defaultValue` on the server/first client render, then syncs from
// localStorage in an effect (mounted-guard pattern) to avoid hydration
// mismatches. Writes are mirrored back to localStorage on every change.
//
// Keys in SHARED_KEYS are the team's data: they are read and saved only while
// a manager is signed in, and every change also goes to the shared database
// (see cloud.ts), which keeps them the same on every device.
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: { migrate?: (raw: unknown) => T }
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const mounted = useRef(false);
  const shared = SHARED_KEYS.has(key);
  const cloud = useCloud();
  const ready = shared && (cloud.status === "ready" || cloud.status === "error");

  useEffect(() => {
    const load = () => {
      if (shared && !cloudReady()) {
        setValue(defaultValue);
        mounted.current = true;
        return;
      }
      try {
        const raw = window.localStorage.getItem(key);
        if (raw != null) {
          const parsed = JSON.parse(raw);
          setValue(options?.migrate ? options.migrate(parsed) : (parsed as T));
        } else if (shared) {
          setValue(defaultValue);
        }
      } catch {
        // ignore malformed localStorage data, keep default
      } finally {
        mounted.current = true;
      }
    };
    load();
    if (!shared) return;
    const onSync = (e: Event) => {
      const changed = (e as CustomEvent<string | null>).detail;
      if (changed == null || changed === key) load();
    };
    window.addEventListener(SHARED_EVENT, onSync);
    return () => window.removeEventListener(SHARED_EVENT, onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (mounted.current && (!shared || cloudReady())) {
          try {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          } catch {
            // ignore write failures (e.g. private browsing quota)
          }
          if (shared) saveShared(key, resolved);
        }
        return resolved;
      });
    },
    [key, shared]
  );

  return [value, update];
}
