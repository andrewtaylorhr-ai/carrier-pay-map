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
  "cdlPayMapPipelineInbox", // written only by the Gmail script (pipeline-script.ts)
  "cdlPayMapPipeline",
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
// Saving, per key: the timer waiting to send, whether a send is under way,
// the latest value (sent once the current send ends), and what this browser
// sent lately, so the database echoing our own saves back doesn't overwrite
// what was typed since.
type Save = { timer?: ReturnType<typeof setTimeout>; sending: boolean; value?: unknown; dirty: boolean; sent: string[] };
const saves = new Map<string, Save>();
let started = false;

// JSON with object keys sorted: the database (jsonb) reorders keys.
function canonical(v: unknown): string {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, (x as Record<string, unknown>)[k]]))
      : x
  );
}

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
      if (!row?.key || !SHARED_KEYS.has(row.key)) return;
      const save = saves.get(row.key);
      // still saving here: this browser's newer value wins
      if (save && (save.timer || save.sending)) return;
      const incoming = canonical(row.value);
      if (save?.sent.includes(incoming)) return;
      const local = localStorage.getItem(row.key);
      try {
        if (local != null && canonical(JSON.parse(local)) === incoming) return;
      } catch {
        // unreadable local value: take the database's
      }
      localStorage.setItem(row.key, JSON.stringify(row.value));
      announce(row.key);
    })
    .subscribe();
}

function leave(signedOut: boolean) {
  if (channel) sb().removeChannel(channel);
  channel = null;
  saves.forEach((s) => clearTimeout(s.timer));
  saves.clear();
  // This browser's copy goes with the sign-out; it is safe in the database.
  if (signedOut) SHARED_KEYS.forEach((k) => localStorage.removeItem(k));
  setState({ status: "signedOut", email: "", message: "" });
  announce(null);
}

// Saves a shared key's new value a moment after the last change, one send
// at a time per key.
export function saveShared(key: string, value: unknown) {
  let save = saves.get(key);
  if (!save) saves.set(key, (save = { sending: false, dirty: false, sent: [] }));
  save.value = value;
  save.dirty = true;
  clearTimeout(save.timer);
  save.timer = setTimeout(() => {
    save.timer = undefined;
    send(key, save);
  }, 400);
}

async function send(key: string, save: Save) {
  if (save.sending || !save.dirty) return;
  save.sending = true;
  save.dirty = false;
  const value = save.value;
  save.sent = [...save.sent.slice(-19), canonical(value)];
  const { error } = await sb().from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
  save.sending = false;
  if (error) setState({ message: `Not saved to the shared database: ${error.message}` });
  else if (state.message) setState({ message: "" });
  // typed more while sending (and no timer will send it)
  if (save.dirty && !save.timer) send(key, save);
}

export async function signIn(email: string, password: string) {
  const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
  return error ? error.message : "";
}

export async function signOut() {
  await sb().auth.signOut();
}
