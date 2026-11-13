// The Google Apps Script the manager pastes into script.google.com. It runs in
// their Gmail every 10 minutes and saves the no-reply emails to the shared
// database (PIPELINE_INBOX_KEY), signed in as the pipeline account whose email
// and password the manager keeps in the script's own properties.
import { PIPELINE_INBOX_KEY, PIPELINE_SENDER } from "@/lib/pipeline";

const SUPABASE_URL = "https://cwagyfzverxrmjridwsu.supabase.co";
const SUPABASE_KEY = "sb_publishable_bVk_TFB4NbaYFwKXcitb1A_dJNUT4CJ";

export const PIPELINE_SCRIPT = `// Driver Pipeline: Gmail -> Class A Recruiting app
// Reads the ${PIPELINE_SENDER} emails and saves them for the Driver Pipeline page.
// Saves the driver's name, carrier, recruiter, date and the recruiter message.
// Never saves the driver's phone, email or SSN.
//
// Setup: Project Settings -> Script properties -> add PIPELINE_EMAIL and
// PIPELINE_PASSWORD (the pipeline account made in Supabase), then run setup().

const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_KEY = "${SUPABASE_KEY}";
const KEY = "${PIPELINE_INBOX_KEY}";
const SENDER = "${PIPELINE_SENDER}";
const FOLLOWUP_SUBJECT = "Copy: New message";
const DQP_SUBJECT = ""; // the DQP schedule email's subject, e.g. "DQP Scheduled"
const KEEP_DAYS = 180; // emails older than this drop off the page
const FIRST_RUN_DAYS = 60; // how far back the first run reads

// Run once: checks every 10 minutes from now on.
function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("syncPipeline").timeBased().everyMinutes(10).create();
  syncPipeline();
}

// Run to see what the script reads from the last 7 days. Saves nothing.
function testRead() {
  scan_(7).forEach((e) => Logger.log(JSON.stringify(e)));
}

function syncPipeline() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const token = signIn_();
    const current = load_(token) || { events: [] };
    const seen = new Set(current.events.map((e) => e.id));
    const found = scan_(current.events.length ? 3 : FIRST_RUN_DAYS).filter((e) => !seen.has(e.id));
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    const events = current.events
      .concat(found)
      .filter((e) => Date.parse(e.at) >= cutoff)
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    save_(token, { events: events, updatedAt: new Date().toISOString() });
  } finally {
    lock.releaseLock();
  }
}

function scan_(days) {
  let q = "from:" + SENDER;
  if (DQP_SUBJECT) q = "(" + q + ' OR subject:"' + DQP_SUBJECT + '")';
  q += " newer_than:" + days + "d";
  const out = [];
  for (let start = 0; ; start += 100) {
    const threads = GmailApp.search(q, start, 100);
    threads.forEach((t) =>
      t.getMessages().forEach((m) => {
        const e = read_(m, days);
        if (e) out.push(e);
      })
    );
    if (threads.length < 100) break;
  }
  return out;
}

function read_(m, days) {
  if (m.getDate().getTime() < Date.now() - days * 864e5) return null;
  const subject = m.getSubject() || "";
  const from = (m.getFrom() || "").toLowerCase();
  const body = (m.getPlainBody() || "").replace(/\\r/g, "");
  const base = { id: m.getId(), at: m.getDate().toISOString(), subject: mask_(subject).slice(0, 200) };
  if (DQP_SUBJECT && subject.toLowerCase().indexOf(DQP_SUBJECT.toLowerCase()) >= 0)
    return Object.assign(base, { type: "dqp", message: mask_(body).slice(0, 600) });
  if (from.indexOf(SENDER) < 0) return null;
  if (subject.indexOf(FOLLOWUP_SUBJECT) >= 0) return Object.assign(base, { type: "followup", message: mask_(body).slice(0, 600) });
  const name = field_(body, "Name");
  const recruiter = field_(body, "Recruiter");
  if (!name || !recruiter) return null;
  const msg = body.match(/Recruiter Message\\s*:\\s*([\\s\\S]*)/i);
  return Object.assign(base, {
    type: "submission",
    driver: name,
    carrier: field_(body, "Carrier"),
    recruiter: recruiter,
    message: msg ? mask_(msg[1].trim()).slice(0, 1000) : "",
  });
}

// "Name: John Smith" -> "John Smith"
function field_(body, label) {
  const m = body.match(new RegExp("^\\\\s*\\\\*?" + label + "\\\\*?\\\\s*:\\\\s*(.+)$", "im"));
  return m ? m[1].trim() : "";
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

function save_(token, value) {
  UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/app_state?on_conflict=key", {
    method: "post",
    contentType: "application/json",
    headers: Object.assign(headers_(token), { Prefer: "resolution=merge-duplicates,return=minimal" }),
    payload: JSON.stringify([{ key: KEY, value: value, updated_at: new Date().toISOString() }]),
  });
}
`;
