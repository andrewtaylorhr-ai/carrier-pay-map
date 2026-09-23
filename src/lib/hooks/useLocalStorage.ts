"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Generic client-only localStorage-backed state. SSR-safe: starts from
// `defaultValue` on the server/first client render, then syncs from
// localStorage in an effect (mounted-guard pattern) to avoid hydration
// mismatches. Writes are mirrored back to localStorage on every change.
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: { migrate?: (raw: unknown) => T }
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const mounted = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed = JSON.parse(raw);
        setValue(options?.migrate ? options.migrate(parsed) : (parsed as T));
      }
    } catch {
      // ignore malformed localStorage data, keep default
    } finally {
      mounted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (mounted.current) {
          try {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          } catch {
            // ignore write failures (e.g. private browsing quota)
          }
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
}
