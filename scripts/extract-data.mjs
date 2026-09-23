// One-off extraction tool: pulls the pure data declarations out of the
// original Multi_Carrier_Pay_Map.html (lines 125-321, everything BEFORE any
// DOM/d3/localStorage code starts) and dumps them as JSON + decoded logo
// PNGs, so the React rebuild's TS data modules can be generated from real
// data instead of hand-retyped. Safe to re-run any time the source HTML
// data changes; output lands in scripts/.extracted/ (gitignored) and
// public/logos/ (committed).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_HTML =
  process.env.PAY_MAP_SRC ||
  path.join(process.env.USERPROFILE || process.env.HOME, "Downloads", "Multi_Carrier_Pay_Map.html");

const OUT_DIR = path.join(__dirname, ".extracted");
const LOGO_DIR = path.join(REPO_ROOT, "public", "logos");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(LOGO_DIR, { recursive: true });

const html = fs.readFileSync(SRC_HTML, "utf8");
const lines = html.split("\n");

// 1-indexed 125..321 inclusive -> 0-indexed slice(124, 321)
const START_LINE = 125;
const END_LINE = 321;
const block = lines.slice(START_LINE - 1, END_LINE).join("\n");

// Sanity check: the block should start with SWIFT_DATA and end with CARRIER_ORDER.
if (!/^const SWIFT_DATA/.test(block.trim())) {
  throw new Error(
    `Expected block to start with "const SWIFT_DATA" — source HTML line numbers may have shifted. First line was: ${block.split("\n")[0]}`
  );
}
if (!/CARRIER_ORDER = \[/.test(block)) {
  throw new Error("Expected block to contain CARRIER_ORDER — source HTML line numbers may have shifted.");
}

const VARS = [
  "SWIFT_DATA",
  "SWIFT_CATS",
  "USX_OTR_SOLO_REGIONS",
  "USX_LOYALTY",
  "USX_SHORTHAUL",
  "USX_STATE_REGION",
  "USX_DEDICATED_HOME_WEEKLY",
  "USX_DEDICATED_DAILY_TEAM",
  "USX_DAILY_TEAM_NOTE",
  "USX_OTR_REGIONAL",
  "USX_CATS",
  "PAM_DOMICILES",
  "PAM_TIER_CPM",
  "PAM_CATS",
  "TRANSAM_HIRE_STATES",
  "TRANSAM_NOHIRE_STATES",
  "TRANSAM_CATS",
  "US_STATE_ABBR",
  "CRE_CADENCE_LABEL",
  "CRE_CATS",
  "CRE_ACCOUNTS",
  "ALL_STATES",
  "LOWER_48",
  "CARRIERS",
  "CARRIER_ORDER",
];

const context = {};
vm.createContext(context);
vm.runInContext(block, context, { filename: "pay-map-data-block.js" });
const dump = vm.runInContext(`({${VARS.join(",")}})`, context);

// --- Decode + write carrier logos, strip them out of the JSON dump ---
const carriersForJson = {};
for (const [id, meta] of Object.entries(dump.CARRIERS)) {
  const match = /^data:image\/png;base64,(.+)$/.exec(meta.logo || "");
  if (!match) {
    throw new Error(`Carrier "${id}" logo is not a base64 PNG data URI as expected`);
  }
  const buf = Buffer.from(match[1], "base64");
  const file = `${id}.png`;
  fs.writeFileSync(path.join(LOGO_DIR, file), buf);
  carriersForJson[id] = {
    label: meta.label,
    color: meta.color,
    catsRef: null, // resolved to the real cats array by name below
    logo: `/logos/${file}`,
  };
}
// CARRIERS.cats originally references the *_CATS consts by identity; re-attach by matching array contents.
const catsByConst = {
  swift: dump.SWIFT_CATS,
  usx: dump.USX_CATS,
  pam: dump.PAM_CATS,
  transam: dump.TRANSAM_CATS,
  cre: dump.CRE_CATS,
};
for (const id of Object.keys(carriersForJson)) {
  carriersForJson[id].cats = catsByConst[id];
  delete carriersForJson[id].catsRef;
}

const outputs = {
  "swift-data.json": dump.SWIFT_DATA,
  "swift-cats.json": dump.SWIFT_CATS,
  "usx-otr-solo-regions.json": dump.USX_OTR_SOLO_REGIONS,
  "usx-loyalty.json": dump.USX_LOYALTY,
  "usx-shorthaul.json": dump.USX_SHORTHAUL,
  "usx-state-region.json": dump.USX_STATE_REGION,
  "usx-dedicated-home-weekly.json": dump.USX_DEDICATED_HOME_WEEKLY,
  "usx-dedicated-daily-team.json": dump.USX_DEDICATED_DAILY_TEAM,
  "usx-daily-team-note.json": dump.USX_DAILY_TEAM_NOTE,
  "usx-otr-regional.json": dump.USX_OTR_REGIONAL,
  "usx-cats.json": dump.USX_CATS,
  "pam-domiciles.json": dump.PAM_DOMICILES,
  "pam-tier-cpm.json": dump.PAM_TIER_CPM,
  "pam-cats.json": dump.PAM_CATS,
  "transam-hire-states.json": dump.TRANSAM_HIRE_STATES,
  "transam-nohire-states.json": dump.TRANSAM_NOHIRE_STATES,
  "transam-cats.json": dump.TRANSAM_CATS,
  "us-state-abbr.json": dump.US_STATE_ABBR,
  "cre-cadence-label.json": dump.CRE_CADENCE_LABEL,
  "cre-cats.json": dump.CRE_CATS,
  "cre-accounts.json": dump.CRE_ACCOUNTS,
  "all-states.json": dump.ALL_STATES,
  "lower-48.json": dump.LOWER_48,
  "carriers.json": carriersForJson,
  "carrier-order.json": dump.CARRIER_ORDER,
};

for (const [file, value] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(value, null, 2));
}

// --- Spot-check counts against project memory figures ---
const checks = [
  ["CRE_ACCOUNTS length", dump.CRE_ACCOUNTS.length, 56],
  ["ALL_STATES length", dump.ALL_STATES.length, 50],
  ["CARRIER_ORDER length", dump.CARRIER_ORDER.length, 5],
  ["USX_DEDICATED_HOME_WEEKLY length", dump.USX_DEDICATED_HOME_WEEKLY.length, 14],
  ["USX_DEDICATED_DAILY_TEAM length", dump.USX_DEDICATED_DAILY_TEAM.length, 8],
  ["PAM_DOMICILES length", dump.PAM_DOMICILES.length, 44],
];

console.log("Extraction complete.\n");
console.log("Spot-checks:");
for (const [label, actual, expected] of checks) {
  const ok = expected == null || actual === expected;
  console.log(`  ${ok ? "OK  " : "WARN"} ${label}: ${actual}${expected != null ? ` (expected ${expected})` : ""}`);
}
console.log(`\nWrote ${Object.keys(outputs).length} JSON files to ${OUT_DIR}`);
console.log(`Wrote ${Object.keys(carriersForJson).length} logo PNGs to ${LOGO_DIR}`);
