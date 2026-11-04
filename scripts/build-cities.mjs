// Puts every carrier account on the map: finds the city (or cities) each
// account hires from and looks up its location in the US Census Bureau 2024
// Gazetteer of places (public domain; compacted copy in
// scripts/data/census-places-2024.tsv).
//
// Where the city comes from, in order:
//   1. city names in the account name / Swift "Hiring City(s)" column /
//      PAM domicile, matched against Census places in the account's states
//   2. otherwise, for map-sourced accounts (Hub Group, USX), the nearest
//      Census place to the account's own pin / hiring-area center
//
// Writes src/lib/carriers/generated/account-cities.json
//   { [accountId]: [[city, ST, lon, lat], ...] }
// and major-cities.json (reference labels drawn on the map).
//
// Run after scripts/build-accounts.mjs: node scripts/build-cities.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.join(__dirname, "..", "src", "lib", "carriers", "generated");
const read = (f) => JSON.parse(fs.readFileSync(path.join(GEN, f), "utf8"));

const ABBR = read("us-state-abbr.json"); // "IL" -> "Illinois"
const NAME_TO_ABBR = Object.fromEntries(Object.entries(ABBR).map(([k, v]) => [v, k]));

/* ---------- Census places ---------- */
const PLACES = fs
  .readFileSync(path.join(__dirname, "data", "census-places-2024.tsv"), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [name, st, lat, lon, area] = line.split("\t");
    return { name, st, lat: Number(lat), lon: Number(lon), area: Number(area) };
  });

// Place names that are also everyday words in account titles.
const STOP = new Set(
  (
    "central regional western eastern northern southern division valley comfort zone region tri state based " +
    "intermodal weekend wrap day night mid east west north south home lake bay coast atlantic midwest southeast " +
    "northeast southwest truckload final mile utility spotter yard local linehaul team teams solo fleet express " +
    "support target ross dollar depot lowes kroger walmart meijer staples costco michaels hershey bimbo flower " +
    "fresh foods sun star auto haul dry reefer flatbed regular dedicated tour relay true loop lane market area " +
    "city county new port center plains grove harbor springs park hill hills heights junction station village " +
    "lakes island rock ridge view point fort mount mountain beach forest garden gardens"
  )
    .split(" ")
    .concat(Object.values(ABBR).map((n) => n.toLowerCase())) // "Ohio", "Nevada"… are also towns
);

const byState = new Map();
PLACES.forEach((p) => {
  const names = [p.name];
  // "Nashville-Davidson", "Louisville/Jefferson County" -> also "Nashville", "Louisville"
  const short = p.name.split(/[-/]/)[0].trim();
  if (short !== p.name && short.length >= 4) names.push(short);
  if (p.name === "Boise City") names.push("Boise"); // Census name for Boise, ID
  if (/^St\. /.test(p.name)) names.push(p.name.replace(/^St\. /, "St "), p.name.replace(/^St\. /, "Saint "));
  names.forEach((n) => {
    if (n.length < 4 || STOP.has(n.toLowerCase())) return;
    if (!byState.has(p.st)) byState.set(p.st, []);
    byState.get(p.st).push({ key: n, place: p });
  });
});
byState.forEach((list) => list.sort((a, b) => b.key.length - a.key.length));

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regexCache = new Map();
const wordRe = (k) => {
  if (!regexCache.has(k)) regexCache.set(k, new RegExp(`(^|[^A-Za-z])${esc(k)}(?![A-Za-z])`, "i"));
  return regexCache.get(k);
};

// Spell out the short forms carriers use ("Ft Wayne", "OKC", "Mt Vernon").
const expand = (t) =>
  t
    .replace(/\bFt\.?\s+/g, "Fort ")
    .replace(/\bMt\.?\s+/g, "Mount ")
    .replace(/\bOKC\b/g, "Oklahoma City")
    .replace(/\bSLC\b/g, "Salt Lake City")
    .replace(/\bPHX\b/g, "Phoenix")
    .replace(/\bKC\b/g, "Kansas City");

// Cities named in `raw`, limited to places in `states` (2-letter codes).
// `preferred` = state codes written in the text, which win ties.
function citiesInText(raw, states, preferred = []) {
  if (!raw || /\bdo not\b/i.test(raw)) return [];
  const text = expand(raw);
  const found = [];
  const taken = []; // [start, end) spans already claimed by a longer name
  states.forEach((st) => {
    (byState.get(st) || []).forEach(({ key, place }) => {
      const m = wordRe(key).exec(text);
      if (!m) return;
      const start = m.index + m[1].length;
      const end = start + key.length;
      if (taken.some(([a, b]) => start >= a && end <= b && !(a === start && b === end))) return;
      taken.push([start, end]);
      found.push({ place, start, followedBy: text.slice(end).match(/^[\s,]*([A-Z]{2})\b/)?.[1] });
    });
  });
  // Same city name in several states: keep the one whose state code follows
  // it in the text, else the largest place.
  const best = new Map();
  found.forEach((f) => {
    const k = f.place.name.toLowerCase();
    const cur = best.get(k);
    const score = (x) =>
      (x.followedBy === x.place.st ? 1e6 : 0) + (preferred.includes(x.place.st) ? 1e5 : 0) + x.place.area;
    if (!cur || score(f) > score(cur)) best.set(k, f);
  });
  return [...best.values()].sort((a, b) => a.start - b.start).map((f) => f.place);
}

function nearestPlace([lon, lat], states) {
  let best = null;
  let bestD = Infinity;
  PLACES.forEach((p) => {
    if (states.length && !states.includes(p.st)) return;
    if (p.area < 1) return; // skip tiny CDPs as labels
    const d = (p.lat - lat) ** 2 + ((p.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  });
  return best && Math.sqrt(bestD) * 69 < 60 ? best : null;
}

const codesIn = (text) => [...String(text).matchAll(/\b([A-Z]{2})\b/g)].map((m) => m[1]).filter((c) => ABBR[c]);
const toRow = (p) => [p.name, p.st, Number(p.lon.toFixed(4)), Number(p.lat.toFixed(4))];

/* ---------- accounts ---------- */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Same ids accounts.ts gives PAM / CR England accounts.
const sources = [
  ...["swift", "jbh", "hub", "usx"].flatMap((c) => read(`accounts-${c}.json`)),
  ...read("pam-domiciles.json").map((d) => ({
    id: `pam:${slug(d.city)}-${slug(d.state)}:otr`,
    name: `${d.city}, ${NAME_TO_ABBR[d.state] || ""}`,
    states: [d.state],
  })),
  ...read("cre-accounts.json").map((a, i) => ({ id: `cre:${slug(a.name)}-${i}`, name: a.name, states: a.states })),
];

const out = {};
let placed = 0;
sources.forEach((a) => {
  const codes = (a.states || []).map((s) => NAME_TO_ABBR[s]).filter(Boolean);
  // A state code written in the account name ("Mehoopany PA") pins the
  // name's city to that state; the Swift hiring-city list can span all of
  // the account's states.
  const nameCodes = codesIn(a.name);
  const list = a.hiringCities || "";
  const fromName = citiesInText(a.name, nameCodes.length ? nameCodes : codes, nameCodes);
  const fromList = citiesInText(list, [...new Set([...codesIn(list), ...codes])], codesIn(list));
  const seen = new Set();
  let cities = [...fromName, ...fromList]
    .filter((p) => {
      const k = `${p.name}|${p.st}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8);
  if (!cities.length && a.pin) {
    const near = nearestPlace(a.pin, codes);
    if (near) cities = [{ ...near, lon: a.pin[0], lat: a.pin[1] }];
  }
  if (cities.length) {
    out[a.id] = cities.map(toRow);
    placed++;
  }
});
fs.writeFileSync(path.join(GEN, "account-cities.json"), JSON.stringify(out) + "\n");

/* ---------- major reference cities ---------- */
const MAJOR = [
  ["New York", "NY"], ["Los Angeles", "CA"], ["Chicago", "IL"], ["Houston", "TX"], ["Phoenix", "AZ"],
  ["Philadelphia", "PA"], ["San Antonio", "TX"], ["San Diego", "CA"], ["Dallas", "TX"], ["Austin", "TX"],
  ["Jacksonville", "FL"], ["Fort Worth", "TX"], ["Columbus", "OH"], ["Charlotte", "NC"], ["Indianapolis", "IN"],
  ["San Francisco", "CA"], ["Seattle", "WA"], ["Denver", "CO"], ["Oklahoma City", "OK"], ["Nashville", "TN"],
  ["El Paso", "TX"], ["Washington", "DC"], ["Las Vegas", "NV"], ["Boston", "MA"], ["Portland", "OR"],
  ["Louisville", "KY"], ["Memphis", "TN"], ["Detroit", "MI"], ["Baltimore", "MD"], ["Milwaukee", "WI"],
  ["Albuquerque", "NM"], ["Tucson", "AZ"], ["Fresno", "CA"], ["Sacramento", "CA"], ["Kansas City", "MO"],
  ["Atlanta", "GA"], ["Omaha", "NE"], ["Raleigh", "NC"], ["Miami", "FL"], ["Minneapolis", "MN"],
  ["Tulsa", "OK"], ["Tampa", "FL"], ["Orlando", "FL"], ["New Orleans", "LA"], ["Cleveland", "OH"],
  ["Pittsburgh", "PA"], ["Cincinnati", "OH"], ["St. Louis", "MO"], ["Salt Lake City", "UT"], ["Boise", "ID"],
  ["Spokane", "WA"], ["Billings", "MT"], ["Fargo", "ND"], ["Sioux Falls", "SD"], ["Des Moines", "IA"],
  ["Little Rock", "AR"], ["Birmingham", "AL"], ["Jackson", "MS"], ["Richmond", "VA"], ["Buffalo", "NY"],
  ["Laredo", "TX"], ["Reno", "NV"], ["Cheyenne", "WY"], ["Columbia", "SC"], ["Savannah", "GA"],
  ["Knoxville", "TN"], ["Wichita", "KS"], ["Lexington", "KY"], ["Hartford", "CT"], ["Portland", "ME"],
  ["Burlington", "VT"], ["Charleston", "WV"], ["Lubbock", "TX"], ["Amarillo", "TX"], ["Mobile", "AL"],
  ["Greenville", "SC"], ["Harrisburg", "PA"], ["Toledo", "OH"], ["Grand Rapids", "MI"], ["Madison", "WI"],
];
const major = MAJOR.map(([name, st]) => {
  const p = PLACES.filter(
    (x) => x.st === st && (x.name === name || x.name === `${name} City` || x.name.split(/[-/]/)[0].trim() === name)
  ).sort(
    (a, b) => b.area - a.area
  )[0];
  if (!p) console.warn("major city not found:", name, st);
  return p && [name, st, Number(p.lon.toFixed(4)), Number(p.lat.toFixed(4))];
}).filter(Boolean);
fs.writeFileSync(path.join(GEN, "major-cities.json"), JSON.stringify(major) + "\n");

console.log(`placed ${placed} of ${sources.length} accounts; ${major.length} major cities`);
const missing = sources.filter((a) => !out[a.id]).map((a) => a.name);
console.log(`no city found for ${missing.length}:`, missing.slice(0, 40).join(" | "));
