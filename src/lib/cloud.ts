"use client";

// Shared database (Supabase) for the team's data. Managers sign in with email
// and password; once signed in, every key in SHARED_KEYS lives in the
// `app_state` table (one row per key, the same JSON that used to sit only in
// this browser's localStorage). localStorage stays as this browser's copy.
// Signed out, those keys show their defaults and nothing is saved.
//
// On sign-in: rows from the database win; keys the database doesn't have yet
// are uploaded from this browser (the first manager's data moves up). Every
// change is saved a moment later, and changes from other devices arrive live.
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

// The project URL and publishable key are public by design; the table is
// protected by row-level security (signed-in managers only) and sign-ups are off.
const SUPABASE_URL = "https://cwagyfzverxrmjridwsu.supabase.co";
const SUPABASE_KEY = "sb_publishable_bVk_TFB4NbaYFwKXcitb1A_dJNUT4CJ";
const TABLE = "app_state";

export const SHARED_KEYS = new Set([
  "cdlPayMapRecruiters",
  "cdlPayMapAssignments",
  "cdlPayMapRecruiterAssignments",
  "cdlPayMapRecruiterAccounts",
  "cdlPayMapRecruiterPlans",
  "cdlPayMapRecruiterStatus",
  "cdlPayMapRecruiterTeams",
  "cdlPayMapRecruiterActuals",
  "cdlPayMapMonthlyReports",
  "cdlPayMapCarrierActivity",
  "cdlPayMapTracker",
  "cdlPayMapTrainees",
  "cpm_agencies",
  "cpm_carrierRules",
  "cpm_trainingSettings",
]);

// Fired on window when shared values in localStorage changed; detail is the
// key, or null for all of them.
export const SHARED_EVENT = "cpm-shared-sync";

export type CloudState = {
  status: "loading" | "signedOut" | "syncing" | "ready" | "error";
  email: string;
  message: string; // last problem, shown under the account box
};

let client: SupabaseClient | null = null;
let channel: RealtimeChannel | null = null;
let state: CloudState = { status: "loading", email: "", message: "" };
const listeners = new Set<() => void>();
const pending = new Map<string, ReturnType<typeof setTimeout>>();
let started = false;

function sb() {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

function setState(patch: Partial<CloudState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function announce(key: string | null) {
  window.dispatchEvent(new CustomEvent(SHARED_EVENT, { detail: key }));
}

export const cloudReady = () => state.status === "ready" || state.status === "error";

export function getCloudState() {
  return state;
}

export function subscribeCloud(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  sb().auth.onAuthStateChange((event, session) => {
    // run outside the auth callback (supabase-js advises against awaiting in it)
    setTimeout(() => {
      if (session) {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") pull(session.user.email ?? "");
      } else {
        leave(event === "SIGNED_OUT");
      }
    }, 0);
  });
}

async function pull(email: string) {
  if (state.status === "syncing" || (cloudReady() && state.email === email)) return;
  setState({ status: "syncing", email, message: "" });
  const { data, error } = await sb().from(TABLE).select("key,value");
  if (error) {
    // keep working from this browser's copy
    setState({ status: "error", message: `Couldn't load shared data: ${error.message}` });
    announce(null);
    return;
  }
  const inDb = new Map((data ?? []).map((r) => [r.key as string, r.value]));
  const uploads: { key: string; value: unknown }[] = [];
  for (const key of SHARED_KEYS) {
    if (inDb.has(key)) {
      localStorage.setItem(key, JSON.stringify(inDb.get(key)));
      continue;
    }
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    try {
      uploads.push({ key, value: JSON.parse(raw) });
    } catch {
      // unreadable local value, skip it
    }
  }
  if (uploads.length) {
    const up = await sb().from(TABLE).upsert(uploads.map((u) => ({ ...u, updated_at: new Date().toISOString() })));
    if (up.error) setState({ message: `Couldn't upload this browser's data: ${up.error.message}` });
  }
  listen();
  setState({ status: "ready" });
  announce(null);
}

function listen() {
  if (channel) return;
  channel = sb()
    .channel("app_state")
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, (change) => {
      const row = change.new as { key?: string; value?: unknown };
      if (!row?.key || !SHARED_KEYS.has(row.key) || pending.has(row.key)) return;
      const raw = JSON.stringify(row.value);
      if (localStorage.getItem(row.key) === raw) return;
      localStorage.setItem(row.key, raw);
      announce(row.key);
    })
    .subscribe();
}

function leave(signedOut: boolean) {
  if (channel) sb().removeChannel(channel);
  channel = null;
  pending.forEach((t) => clearTimeout(t));
  pending.clear();
  // This browser's copy goes with the sign-out; it is safe in the database.
  if (signedOut) SHARED_KEYS.forEach((k) => localStorage.removeItem(k));
  setState({ status: "signedOut", email: "", message: "" });
  announce(null);
}

// Saves a shared key's new value a moment after the last change.
export function saveShared(key: string, value: unknown) {
  const t = pending.get(key);
  if (t) clearTimeout(t);
  pending.set(
    key,
    setTimeout(async () => {
      const { error } = await sb().from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
      pending.delete(key);
      if (error) setState({ message: `Not saved to the shared database: ${error.message}` });
      else if (state.message) setState({ message: "" });
    }, 400)
  );
}

export async function signIn(email: string, password: string) {
  const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
  return error ? error.message : "";
}

export async function signOut() {
  await sb().auth.signOut();
}
