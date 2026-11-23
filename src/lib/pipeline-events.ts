"use client";

// The Driver Pipeline emails, one row each in the shared database's
// pipeline_events table (supabase/pipeline_events.sql), added by the Gmail
// script. This browser keeps the rows it already has and asks only for the
// ones added since, so a visit downloads a few new emails, not all of them.
// Like the team's other shared data, they show only while signed in and leave
// this browser on sign-out.
import { useSyncExternalStore } from "react";
import { cloudReady, getCloudState, sb, subscribeCloud } from "@/lib/cloud";
import { useCloud } from "@/lib/hooks/useLocalStorage";
import type { PipelineEvent, PipelineEventType } from "@/lib/pipeline";

const TABLE = "pipeline_events";
const CACHE_KEY = "cpm_pipelineEvents";
const PAGE = 1000; // the most rows the database sends at once
const EVERY_MS = 3 * 60e3; // the script adds emails every 10 minutes

export type PipelineRows = {
  events: PipelineEvent[];
  loading: boolean; // the first download hasn't finished yet
  error: string;
};

type Row = {
  id: string;
  type: PipelineEventType;
  at: string;
  driver: string | null;
  carrier: string | null;
  recruiter: string | null;
  subject: string | null;
  message: string | null;
  created_at: string;
};

const EMPTY: PipelineRows = { events: [], loading: true, error: "" };
let rows: PipelineRows = EMPTY;
let since = ""; // created_at of the newest row this browser has
const listeners = new Set<() => void>();
let started = false;
let running = false;

function set(patch: Partial<PipelineRows>) {
  rows = { ...rows, ...patch };
  listeners.forEach((l) => l());
}

function toEvent(r: Row): PipelineEvent {
  return {
    id: r.id,
    type: r.type,
    at: r.at,
    driver: r.driver ?? undefined,
    carrier: r.carrier ?? undefined,
    recruiter: r.recruiter ?? undefined,
    subject: r.subject ?? undefined,
    message: r.message ?? undefined,
  };
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    if (c && Array.isArray(c.events) && typeof c.since === "string") {
      rows = { ...rows, events: c.events };
      since = c.since;
    }
  } catch {
    // unreadable: everything downloads again
  }
}

function writeCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ events: rows.events, since }));
  } catch {
    // this browser's storage is full: kept in memory, downloads again next visit
  }
}

function clear() {
  since = "";
  localStorage.removeItem(CACHE_KEY);
  set({ events: [], loading: true, error: "" });
}

// Downloads the rows added since the newest one this browser has.
async function refresh() {
  if (running || !cloudReady()) return;
  running = true;
  try {
    const have = new Map(rows.events.map((e) => [e.id, e]));
    let newest = since;
    for (let offset = 0; ; offset += PAGE) {
      let q = sb()
        .from(TABLE)
        .select("id,type,at,driver,carrier,recruiter,subject,message,created_at")
        .order("created_at")
        .order("id")
        .range(offset, offset + PAGE - 1);
      // rows saved in the same moment share a created_at, so ask from it again
      if (since) q = q.gte("created_at", since);
      const { data, error } = await q;
      if (error) {
        set({ loading: false, error: error.message });
        return;
      }
      for (const r of (data ?? []) as Row[]) {
        have.set(r.id, toEvent(r));
        if (r.created_at > newest) newest = r.created_at;
      }
      if (!data || data.length < PAGE) break;
    }
    since = newest;
    set({ events: [...have.values()], loading: false, error: "" });
    writeCache();
  } finally {
    running = false;
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  readCache();
  subscribeCloud(() => {
    const { status } = getCloudState();
    if (status === "signedOut") clear();
    else if (cloudReady()) void refresh();
  });
  if (cloudReady()) void refresh();
  setInterval(() => document.visibilityState === "visible" && void refresh(), EVERY_MS);
  // a page left open overnight catches up as soon as it's looked at again
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && void refresh());
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// The pipeline emails from the table; none until signed in.
export function usePipelineRows(): PipelineRows {
  const all = useSyncExternalStore(subscribe, () => rows, () => EMPTY);
  const cloud = useCloud();
  return cloud.status === "ready" || cloud.status === "error" ? all : EMPTY;
}
