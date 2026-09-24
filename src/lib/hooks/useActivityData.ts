"use client";

import { useLocalStorageState } from "./useLocalStorage";
import type { CarrierActivityData } from "@/lib/activity/types";

const KEY = "cdlPayMapCarrierActivity";

export function useActivityData() {
  return useLocalStorageState<CarrierActivityData>(KEY, {});
}
