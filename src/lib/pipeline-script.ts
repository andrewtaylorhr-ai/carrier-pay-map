// The Google Apps Script the manager pastes into script.google.com. It runs in
// their Gmail every 10 minutes and adds each new no-reply email as a row of the
// shared database's pipeline_events table (supabase/pipeline_events.sql); its
// own progress is a small record under PIPELINE_INBOX_KEY. It signs in as the
// pipeline account whose email and password the manager keeps in the script's
// own properties.
import { PIPELINE_INBOX_KEY, PIPELINE_SENDER } from "@/lib/pipeline";

const SUPABASE_URL = "https://cwagyfzverxrmjridwsu.supabase.co";
const SUPABASE_KEY = "sb_publishable_bVk_TFB4NbaYFwKXcitb1A_dJNUT4CJ";

export const PIPELINE_SCRIPT = `// Driver Pipeline: Gmail -> Class A Recruiting app
// Reads the ${PIPELINE_SENDER} emails and saves each one, once, for the
// Driver Pipeline page (one row per email in the pipeline_events table).
// Saves the driver's name, carrier, recruiter, date, the recruiter message and
// the newest note of each "New message" / "Status update" email.
// Never saves the driver's phone, email or SSN.
//
// Setup: Project Settings -> Script properties -> add PIPELINE_EMAIL and
// PIPELINE_PASSWORD (the pipeline account made in Supabase), then run setup().

const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_KEY = "${SUPABASE_KEY}";
const KEY = "${PIPELINE_INBOX_KEY}";
const SENDER = "${PIPELINE_SENDER}";
const FIRST_RUN_DAYS = 60; // how far back the page fills in
const RUN_SECONDS = 240; // Google stops a run at 6 minutes, so each run reads for 4

// Run once: checks every 10 minutes from now on.
function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("syncPipeline").timeBased().everyMinutes(10).create();
  syncPipeline();
}

// Run to see what the script reads from the last day. Saves nothing.
function testRead() {
  scan_("newer_than:1d", new Set()).forEach((e) => Logger.log(JSON.stringify(e)));
}

// Reads the new emails 3 hours at a time, then older ones a day at a time
// until FIRST_RUN_DAYS are in, adding each block's emails to the table as it
// goes. Gmail allows only so many reads a day: when they run out, the blocks
// already read stay saved and the next run carries on from there.
function syncPipeline() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const started = Date.now();
    const token = signIn_();
    const state = load_(token) || {};
    // The emails used to be saved as one big list: move them to the table once.
    if (state.events && state.events.length) {
      for (let i = 0; i < state.events.length; i += 500) insert_(token, state.events.slice(i, i + 500));
    }
    // every email before readTo is in
    let readTo = state.readTo ? Date.parse(state.readTo) : state.updatedAt ? Date.parse(state.updatedAt) - 30 * 60e3 : Date.now() - 2 * 864e5;
    let filled = state.filledTo ? Date.parse(state.filledTo) : Date.now() - 2 * 864e5;
    const oldest = Date.now() - FIRST_RUN_DAYS * 864e5;
    // emails already in the table aren't read again (each read counts)
    const seen = savedIds_(token, filled > oldest ? 0 : readTo - 864e5);
    const sec = (t) => Math.floor(t / 1000);
    const store = () =>
      save_(token, {
        filledTo: new Date(filled).toISOString(),
        readTo: new Date(readTo).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    const timeLeft = () => Date.now() - started < RUN_SECONDS * 1000;
    // 30 minutes of overlap: Gmail can be slow to show a new email in search
    while (timeLeft()) {
      const to = Math.min(readTo + 3 * 3600e3, Date.now());
      insert_(token, scan_("after:" + sec(readTo - 30 * 60e3) + " before:" + sec(to), seen));
      readTo = to;
      store();
      if (to >= Date.now() - 60e3) break;
    }
    while (filled > oldest && timeLeft()) {
      const from = filled - 864e5;
      insert_(token, scan_("after:" + sec(from) + " before:" + sec(filled), seen));
      filled = from;
      store();
    }
  } finally {
    lock.releaseLock();
  }
}

// The emails matching the search that aren't in seen yet (seen is updated).
function scan_(when, seen) {
  const q = "from:" + SENDER + " " + when;
  const out = [];
  for (let start = 0; ; start += 100) {
    const threads = GmailApp.search(q, start, 100);
    GmailApp.getMessagesForThreads(threads).forEach((msgs) =>
      msgs.forEach((m) => {
        const id = m.getId();
        if (seen.has(id)) return;
        seen.add(id);
        const e = read_(m);
        if (e) out.push(e);
      })
    );
    if (threads.length < 100) break;
  }
  return out;
}

function read_(m) {
  const subject = (m.getSubject() || "").replace(/\\s+/g, " ").trim();
  if ((m.getFrom() || "").toLowerCase().indexOf(SENDER) < 0) return null;
  const body = (m.getPlainBody() || "").replace(/\\r/g, "");
  const base = { id: m.getId(), at: m.getDate().toISOString(), subject: mask_(subject).slice(0, 200) };
  const note = note_(subject, body);
  if (note) return Object.assign(base, note);
  const name = field_(body, "Name");
  const recruiter = field_(body, "Recruiter");
  if (!name || !recruiter) return null;
  const msg = body.match(/Recruiter Message\\s*:[\\s*]*([\\s\\S]*?)(\\n\\s*Round robin admin|$)/i);
  return Object.assign(base, {
    type: "submission",
    driver: name,
    carrier: field_(body, "Carrier"),
    recruiter: recruiter,
    message: msg ? mask_(msg[1].trim()).slice(0, 1000) : "",
  });
}

// "Copy: New message: Adam Chambers (Swift) - Lochinbek Kamolov", "New message:
// Kiana Kennison (Swift)" and "Copy: Status update: ...". The email repeats the
// whole conversation; only the newest note (the last one) is kept. A note that
// says a DQP was scheduled goes to the DQP tab.
function note_(subject, body) {
  const s = subject.match(/^(?:Copy:\\s*)?(New message|Status update):\\s*(.+?)\\s*\\(([^)]*)\\)\\s*(?:-\\s*(.+))?$/i);
  if (!s) return null;
  const text = body.split(/\\n\\s*Open the conversation/i)[0];
  const heads = [];
  const re = /^\\s*(.+?) · (\\d{1,2}\\/\\d{1,2}\\/\\d{2,4} \\d{1,2}:\\d{2} ?[AP]M)\\s*$/gim;
  let h;
  while ((h = re.exec(text))) heads.push({ who: h[1].trim(), end: re.lastIndex });
  const last = heads[heads.length - 1];
  const said = last ? text.slice(last.end).replace(/\\s+/g, " ").trim() : text.replace(/\\s+/g, " ").trim();
  const message = (last ? last.who + ": " : "") + said;
  const dqp = /\\bDQP\\b/i.test(said) && /schedul/i.test(said);
  return {
    type: dqp ? "dqp" : "followup",
    driver: s[2],
    carrier: s[3],
    recruiter: s[4] || "",
    message: mask_(message).slice(0, 600),
  };
}

// "Name: John Smith" -> "John Smith"
function field_(body, label) {
  const m = body.match(new RegExp("^\\\\s*\\\\*?" + label + "\\\\*?\\\\s*:\\\\s*(.+)$", "im"));
  return m ? m[1].replace(/\\s+/g, " ").trim() : "";
}

// phone numbers, emails and SSNs never leave Gmail
function mask_(s) {
  return s
    .replace(/[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+/g, "[email]")
    .replace(/\\b\\d{3}-\\d{2}-\\d{4}\\b/g, "[removed]")
    .replace(/(\\+?1[\\s.-]?)?\\(?\\b\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b/g, "[phone]");
}

function headers_(token) {
  return { apikey: SUPABASE_KEY, Authorization: "Bearer " + token };
}

function signIn_() {
  const p = PropertiesService.getScriptProperties();
  const res = UrlFetchApp.fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "post",
    contentType: "application/json",
    headers: { apikey: SUPABASE_KEY },
    payload: JSON.stringify({ email: p.getProperty("PIPELINE_EMAIL"), password: p.getProperty("PIPELINE_PASSWORD") }),
  });
  return JSON.parse(res.getContentText()).access_token;
}

function load_(token) {
  const res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/app_state?select=value&key=eq." + KEY, { headers: headers_(token) });
  const rows = JSON.parse(res.getContentText());
  return rows.length ? rows[0].value : null;
}

// Adds these emails as rows; ones already there are left as they are.
function insert_(token, events) {
  if (!events.length) return;
  const rows = events.map((e) => ({
    id: e.id,
    type: e.type,
    at: e.at,
    driver: e.driver || null,
    carrier: e.carrier || null,
    recruiter: e.recruiter || null,
    subject: e.subject || null,
    message: e.message || null,
  }));
  UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/pipeline_events?on_conflict=id", {
    method: "post",
    contentType: "application/json",
    headers: Object.assign(headers_(token), { Prefer: "resolution=ignore-duplicates,return=minimal" }),
    payload: JSON.stringify(rows),
  });
}

// The ids of the emails saved since this time (0 = all of them).
function savedIds_(token, since) {
  const ids = new Set();
  const when = since ? "&at=gte." + new Date(since).toISOString() : "";
  for (let offset = 0; ; offset += 1000) {
    const res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/pipeline_events?select=id&order=id" + when + "&limit=1000&offset=" + offset, {
      headers: headers_(token),
    });
    const rows = JSON.parse(res.getContentText());
    rows.forEach((r) => ids.add(r.id));
    if (rows.length < 1000) return ids;
  }
}

function save_(token, value) {
  UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/app_state?on_conflict=key", {
    method: "post",
    contentType: "application/json",
    headers: Object.assign(headers_(token), { Prefer: "resolution=merge-duplicates,return=minimal" }),
    payload: JSON.stringify([{ key: KEY, value: value, updated_at: new Date().toISOString() }]),
  });
}
`;
