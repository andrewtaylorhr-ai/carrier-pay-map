// Builds the per-account JSON the Strategy Builder runs on, straight from the
// carriers' own source files (no hand-retyping):
//   Swift     — "Hiring Data Base" Excel export (OPEN rows only)
//   JB Hunt   — "JBH Information" workbook, "Open Positions …" sheet
//   Hub Group — Google My Maps .kmz export ("Open" folder only)
//   USX       — "3rd Party Hiring Map" .kmz export (company-driver folders only)
//
// States: Swift and JB Hunt list them in a column. Hub Group / USX don't, so
// each placemark's hiring-area geometry (pin or polygon) is tested against
// the same states topojson the map draws.
//
// Company drivers only, per explicit user direction: owner-operator / IC
// positions are dropped (USX "Owner Operator-*" folders, JB Hunt "IC" rows).
//
// Usage (defaults to the files in ~/Downloads):
//   node scripts/build-accounts.mjs
//   SWIFT_XLSX=... JBH_XLSX=... HUB_KMZ=... USX_KMZ=... node scripts/build-accounts.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { feature } from "topojson-client";
import { geoAlbersUsa } from "d3-geo";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "src", "lib", "carriers", "generated");
const DL = path.join(process.env.USERPROFILE || process.env.HOME, "Downloads");

const SRC = {
  swift: process.env.SWIFT_XLSX || path.join(DL, "Hiring Data Base (6).xlsx"),
  jbh: process.env.JBH_XLSX || path.join(DL, "JBH Information 11022026.xlsx"),
  hub: process.env.HUB_KMZ || path.join(DL, "Hub Group.kmz"),
  usx: process.env.USX_KMZ || path.join(DL, "2026 USX 3rd Party Hiring Map (1).kmz"),
};

const ABBR = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "us-state-abbr.json"), "utf8"));
const ALL_STATES = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "all-states.json"), "utf8"));
const ABBR_UPPER = Object.fromEntries(Object.entries(ABBR).map(([k, v]) => [k.toUpperCase(), v]));
const toState = (abbr) => ABBR_UPPER[String(abbr).trim().toUpperCase()] || null;

/* ---------- geometry: lon/lat -> state name ---------- */
const topo = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "public", "data", "states-albers-10m.json"), "utf8"));
const STATE_FEATURES = feature(topo, topo.objects.states).features;
// states-albers-10m is pre-projected with this exact projection (us-atlas convention).
const project = geoAlbersUsa().scale(1300).translate([487.5, 305]);

function ringContains(ring, [x, y]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polyContains(polys, pt) {
  // polys: array of polygons, each [outer, ...holes]
  return polys.some((rings) => ringContains(rings[0], pt) && !rings.slice(1).some((h) => ringContains(h, pt)));
}
const STATE_POLYS = STATE_FEATURES.map((f) => ({
  name: f.properties.name,
  polys: f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates,
}));
function stateAt(lon, lat) {
  const p = project([lon, lat]);
  if (!p) return null;
  const hit = STATE_POLYS.find((s) => polyContains(s.polys, p));
  return hit ? hit.name : null;
}
// States a lon/lat polygon overlaps: every vertex, plus a grid of sample
// points inside the polygon (catches states fully inside a big hiring area).
function statesForRing(ring) {
  const out = new Set();
  ring.forEach(([lon, lat]) => {
    const s = stateAt(lon, lat);
    if (s) out.add(s);
  });
  const lons = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const step = Math.max(0.08, Math.min(x1 - x0, y1 - y0) / 25);
  for (let x = x0; x <= x1; x += step) {
    for (let y = y0; y <= y1; y += step) {
      if (ringContains(ring, [x, y])) {
        const s = stateAt(x, y);
        if (s) out.add(s);
      }
    }
  }
  return out;
}

/* ---------- small helpers ---------- */
const clean = (s) => String(s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const lines = (s) =>
  String(s ?? "")
    .split(/\r?\n/)
    .map(clean)
    .filter((x) => x && x.toLowerCase() !== "nan");
const dollars = (s) =>
  (String(s ?? "").match(/\$\s?\d[\d,]*(?:\.\d+)?/g) || []).map((m) => Number(m.replace(/[$,\s]/g, "")));
const slug = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
const sortStates = (set) => ALL_STATES.filter((s) => set.has(s));
// Fallback when a row has no state column value: the state code after the
// city in the account name ("Lewiston, ID", "Mehoopany PA - Regional").
function stateFromName(name) {
  for (const m of String(name).matchAll(/\b([A-Z]{2})\b/g)) {
    const s = toState(m[1]);
    if (s) return s;
  }
  return null;
}

function withIds(carrier, accounts) {
  const seen = new Map();
  return accounts.map((a) => {
    const base = `${carrier}:${slug(a.name)}:${slug(a.cat)}`;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return { id: n === 1 ? base : `${base}-${n}`, carrier, ...a };
  });
}

function blank() {
  return {
    payLow: null,
    payHigh: null,
    payText: "",
    hometime: "",
    approval: "",
    experience: "",
    sob: "",
    notes: "",
  };
}

/* ---------- SWIFT ---------- */
function swiftCat(lob, home) {
  const h = home.join(" ").toLowerCase();
  const daily = /daily|every other day|every (two|three|four) days|twice a week|10 hour/.test(h);
  const weekly = /once a week|weekend|34 hour|twice a week|one to two/.test(h);
  if (lob.startsWith("DED")) return daily ? "Local" : "Dedicated";
  return weekly ? "Regional" : "OTR";
}

function buildSwift() {
  const wb = XLSX.readFile(SRC.swift);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const open = rows.filter((r) => clean(r["Open or Closed"]).toUpperCase() === "OPEN");
  const accounts = open.map((r) => {
    const home = lines(r["Home Time"]);
    const lob = clean(r["LOB (Line of Business)"]);
    const states = new Set(lines(r["Hiring State"]).flatMap((x) => x.split(",")).map(toState).filter(Boolean));
    if (!states.size && stateFromName(r["Account"])) states.add(stateFromName(r["Account"]));
    const pays = dollars(r["Average Earnings per Week"]);
    const radius = clean(r['Live within "X miles" of Zip Code(s)']);
    const bonus = lines(r["BONUS OFFER"]).filter((b) => !/^no bonus/i.test(b));
    const exp = lines(r["Experience Requirements"]);
    const notes = [
      lob,
      radius && radius !== "nan" ? `Live within ${radius} mi of hiring zips` : "",
      clean(r["Teams OK"]).toUpperCase() === "YES" ? "Teams OK" : "",
      lines(r["Required Endorsements/Certificates"]).filter((x) => !/^none$/i.test(x)).join(", "),
      clean(r["Favorable Info on Lane"]),
    ].filter(Boolean);
    return {
      ...blank(),
      name: clean(r["Account"]),
      cat: swiftCat(lob, home),
      states: sortStates(states),
      payLow: pays.length ? Math.min(...pays) : null,
      payHigh: pays.length ? Math.max(...pays) : null,
      payText: pays.length ? lines(r["Average Earnings per Week"]).join(" / ") + " /wk" : "",
      hometime: home.join(", "),
      approval: clean(r["Does position need leadership approval"]).toUpperCase() === "YES" ? "Yes" : "No",
      experience: exp.join(", ") + (clean(r["Trainees OK?"]).toUpperCase() === "YES" ? " (trainees OK)" : ""),
      sob: bonus.join(", "),
      notes: notes.join(" · "),
      // raw city list, only read by build-cities.mjs
      hiringCities: lines(r["Hiring City(s)"]).join(", "),
    };
  });
  return withIds("swift", accounts);
}

/* ---------- JB HUNT ---------- */
function jbhCat(name) {
  const l = name.toLowerCase();
  if (/semi[- ]local/.test(l)) return "Semi-Local";
  if (/final mile/.test(l)) return "Final Mile";
  if (/\blocal\b|spotter/.test(l)) return "Local";
  if (/regional|\breg\b|reegioal/.test(l)) return "Regional";
  if (/\botr\b/.test(l)) return "OTR";
  return "Regional";
}

function buildJbh() {
  const wb = XLSX.readFile(SRC.jbh);
  const sheet = wb.SheetNames.find((n) => /^open positions/i.test(n));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" });
  const [, ...body] = rows;
  const accounts = [];
  body.forEach((r) => {
    const raw = clean(r[0]);
    if (!raw) return;
    // Company drivers only: "IC" = independent contractor (owner-operator).
    if (/\s-\sIC\s-\s/i.test(raw)) return;
    const jobNo = (raw.match(/-\s*(\d{4,6})\s*$/) || [])[1] || "";
    const name = clean(raw.replace(/^3rd party only\s*-\s*/i, "").replace(/-\s*\d{4,6}\s*$/, ""));
    const states = new Set(String(r[3]).split(",").map(toState).filter(Boolean));
    if (!states.size && stateFromName(name)) states.add(stateFromName(name));
    const yearly = Number(r[5]) || null;
    const weekly = yearly ? Math.round(yearly / 52) : null;
    const sobAmt = Number(r[7]) || null;
    const months = r[4] === "" ? null : Number(r[4]);
    accounts.push({
      ...blank(),
      name,
      cat: jbhCat(name),
      states: sortStates(states),
      payLow: weekly,
      payHigh: weekly,
      payText: yearly ? `$${yearly.toLocaleString()}/yr avg gross (~$${weekly.toLocaleString()}/wk)` : "",
      experience: months == null ? "" : months === 0 ? "No experience required" : `${months} months`,
      sob: sobAmt ? `$${sobAmt.toLocaleString()}${clean(r[8]) ? ` (${clean(r[8])})` : ""}` : "",
      notes: [
        jobNo ? `Job #${jobNo}` : "",
        r[2] !== "" ? `${r[2]} drivers needed` : "",
        clean(r[6]).toLowerCase() === "yes" ? "Interview needed" : "",
        /^3rd party only/i.test(raw) ? "3rd party only" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  });
  return withIds("jbh", accounts);
}

/* ---------- KML (Hub Group / USX) ---------- */
// Minimal .kmz (zip) reader: walk the central directory, inflate doc.kml.
function readKml(kmz) {
  const buf = fs.readFileSync(kmz);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error(`${kmz} is not a zip/kmz file`);
  let off = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(off + 10);
    const size = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const local = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    if (name.toLowerCase().endsWith(".kml")) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      return (method === 8 ? zlib.inflateRawSync(data) : data).toString("utf8");
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`No .kml inside ${kmz}`);
}
const stripCdata = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, "");
function descText(p) {
  const m = p.match(/<description>([\s\S]*?)<\/description>/);
  if (!m) return [];
  return stripCdata(m[1])
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map(clean)
    .filter(Boolean);
}
function placemarkName(p) {
  return clean(stripCdata((p.match(/<name>([\s\S]*?)<\/name>/) || [])[1] || ""));
}
// A pin's hiring area as a polygon: circle of `miles` around the point.
function circleRing([lon, lat], miles) {
  const dLat = miles / 69;
  const dLon = miles / (69 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: 36 }, (_, i) => {
    const t = (i / 36) * 2 * Math.PI;
    return [lon + dLon * Math.cos(t), lat + dLat * Math.sin(t)];
  });
}
// pinRadiusMiles: when set, a pin (Point) is treated as "hiring within N
// miles of here" instead of just the state the pin sits in.
function placemarkStates(p, pinRadiusMiles = 0) {
  const out = new Set();
  const coordBlocks = [...p.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)].map((m) =>
    m[1]
      .trim()
      .split(/\s+/)
      .map((t) => t.split(",").map(Number))
      .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]))
  );
  coordBlocks.forEach((ring) => {
    if (ring.length === 1 && pinRadiusMiles) {
      statesForRing(circleRing(ring[0], pinRadiusMiles)).forEach((s) => out.add(s));
    } else if (ring.length === 1) {
      const s = stateAt(ring[0][0], ring[0][1]);
      if (s) out.add(s);
    } else statesForRing(ring).forEach((s) => out.add(s));
  });
  return out;
}
// Where a placemark sits: the pin itself, or the middle of its hiring-area
// shape. Used by build-cities.mjs to put the account on the map.
function placemarkPin(p) {
  const m = p.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
  if (!m) return null;
  const pts = m[1]
    .trim()
    .split(/\s+/)
    .map((t) => t.split(",").map(Number))
    .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
  if (!pts.length) return null;
  const lon = pts.reduce((n, c) => n + c[0], 0) / pts.length;
  const lat = pts.reduce((n, c) => n + c[1], 0) / pts.length;
  return [Number(lon.toFixed(4)), Number(lat.toFixed(4))];
}
function folders(kml) {
  return kml
    .split("<Folder>")
    .slice(1)
    .map((f) => ({
      name: clean(stripCdata((f.match(/<name>([\s\S]*?)<\/name>/) || [])[1] || "")),
      placemarks: [...f.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)].map((m) => m[1]),
    }));
}
// "$1,737/wk avg", "Average Pay: $1,400/week", "$1750/wk avg- day shift"
function weeklyPay(text) {
  const vals = [];
  text.forEach((l) => {
    if (/\/\s?(wk|week)|per week|weekly/i.test(l) && !/top|sign[- ]on|bonus/i.test(l)) {
      dollars(l).filter((v) => v >= 500 && v <= 5000).forEach((v) => vals.push(v));
    }
  });
  return vals;
}
function findLine(text, re) {
  const l = text.find((x) => re.test(x));
  return l ? clean(l.replace(re, "")) : "";
}

/* ---------- HUB GROUP ---------- */
function buildHub() {
  const kml = readKml(SRC.hub);
  const open = folders(kml).find((f) => /^open$/i.test(f.name));
  const accounts = open.placemarks.map((p) => {
    const name = placemarkName(p);
    const text = descText(p).filter((l) => !/^_+$/.test(l));
    const pays = weeklyPay(text);
    const all = text.join(" ");
    const regional = /regional/i.test(name);
    const hazmat = (text.find((l) => /hazmat/i.test(l)) || "").replace(/\*/g, "");
    const payLine = text.find((l) => /^pay[\s:-]/i.test(l)) || "";
    const ort = text.find((l) => /^ORT pay/i.test(l)) || "";
    return {
      ...blank(),
      name,
      cat: regional ? "Regional" : "Local",
      // Every Hub Group listing hires "within a 50-mile radius" of the yard.
      states: sortStates(placemarkStates(p, 50)),
      pin: placemarkPin(p),
      payLow: pays.length ? Math.min(...pays) : null,
      payHigh: pays.length ? Math.max(...pays) : null,
      payText: [pays.length ? `$${Math.min(...pays).toLocaleString()}${pays.length > 1 && Math.max(...pays) !== Math.min(...pays) ? "–$" + Math.max(...pays).toLocaleString() : ""}/wk avg` : "", payLine.replace(/^pay[\s:-]+/i, "")]
        .filter(Boolean)
        .join(" · "),
      hometime: regional ? "Regional — 2-3 layovers per week" : /home daily|local/i.test(all) ? "Home daily" : "",
      sob: "",
      notes: [
        /intermodal/i.test(all) ? "Intermodal / container, no touch" : "",
        /hiring area/i.test(all) ? "Live within 50 mi / 1 hr of the yard" : "",
        hazmat,
        ort,
        text.length ? "" : "No pay/details listed on the source map",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });
  return withIds("hub", accounts);
}

/* ---------- USX ---------- */
const USX_FOLDER_CAT = {
  "dedicated home weekly": "Dedicated Home Weekly",
  "dedicated daily/frequently/team": "Dedicated Daily/Frequently/Team",
  "otr solo company": "OTR Solo Company",
  "otr team company": "OTR Team Company",
  "otr regional": "OTR Regional",
  "12/2 true up fleets": "True Up Fleets",
  "specialized fleets": "Specialized Fleets",
};

// Pin titles double as ad copy ("🔥🔥 DT Joliet, IL $2500 Sign On Bonus! Home
// 3-4 times per week!") — keep just the account, plus a short home-time /
// location qualifier where two pins would otherwise share a name.
function usxName(raw) {
  const base = clean(
    raw
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/\$[\d,]+k?\s*(split\s*)?(sign[- ]on bonus|sob)!*/gi, "")
  );
  const near = (raw.match(/miles (?:of|from) ([A-Za-z .]+?)(?:,|\.|!|\s+[A-Z]{2}\b|$)/i) || [])[1];
  let name = clean(base.split(/!|\s\.\s|\.\s|\s-\s(?=home|must)|\bMUST\b|\bHOME (?:WEEKLY|DAILY)\b/i)[0]);
  name = name.replace(/[-–.,\s]+$/g, "");
  if (/home 3-4 times/i.test(base)) name = name.replace(/\s*home 3-4 times per week/i, "") + " (home 3-4x/wk)";
  else if (/home daily/i.test(base) && !/home daily|local/i.test(name)) name += " (home daily)";
  if (/^quad graphics/i.test(name) && near) name += ` (${clean(near).replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w+/g, (w) => w.toLowerCase())})`;
  return name;
}

function buildUsx() {
  const kml = readKml(SRC.usx);
  const merged = new Map();
  folders(kml).forEach((f) => {
    const cat = USX_FOLDER_CAT[f.name.toLowerCase()];
    if (!cat) return; // CLOSED, Owner Operator-* (company drivers only)
    f.placemarks.forEach((p) => {
      const rawName = placemarkName(p);
      if (/trainer qualifications/i.test(rawName)) return; // info pin, not a position
      const text = descText(p);
      const name = usxName(rawName);
      const sob = (rawName.match(/\$[\d,]+k?\s*(split\s*)?(sign[- ]on bonus|sob)/i) || [])[0] || "";
      const pays = weeklyPay(text.filter((l) => /average/i.test(l)));
      const top = text.find((l) => /top (20%|performers|earners)/i.test(l)) || "";
      const avgLine = findLine(text, /^.*?average (weekly )?pay:?\s*/i);
      const key = `${cat}|${name.toLowerCase()}`;
      const states = placemarkStates(p);
      if (merged.has(key)) {
        states.forEach((s) => merged.get(key).stateSet.add(s));
        return;
      }
      merged.set(key, {
        ...blank(),
        name,
        cat,
        stateSet: states,
        pin: placemarkPin(p),
        payLow: pays.length ? Math.min(...pays) : null,
        payHigh: pays.length ? Math.max(...pays) : null,
        payText: [avgLine && !/not listed/i.test(avgLine) ? avgLine : "", top && !avgLine.includes(top) ? clean(top.replace(/^.*?(top)/i, "Top")) : ""]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 160),
        hometime: findLine(text, /^.*?home time:?\s*/i).slice(0, 100),
        experience: (text.find((l) => /months? (of )?exp|exp(erience)? required/i.test(l)) || "").slice(0, 100),
        sob: sob.replace(/sign[- ]on bonus|sob/i, "sign-on bonus").trim(),
        notes: [findLine(text, /^.*?running area:?\s*/i), findLine(text, /^.*?freight:?\s*/i)]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 220),
      });
    });
  });
  const accounts = [...merged.values()].map(({ stateSet, ...a }) => ({ ...a, states: sortStates(stateSet) }));
  return withIds("usx", accounts);
}

/* ---------- run ---------- */
const builders = { swift: buildSwift, jbh: buildJbh, hub: buildHub, usx: buildUsx };
for (const [id, build] of Object.entries(builders)) {
  const accounts = build();
  const file = path.join(OUT_DIR, `accounts-${id}.json`);
  fs.writeFileSync(file, JSON.stringify(accounts, null, 1) + "\n");
  const noState = accounts.filter((a) => !a.states.length).map((a) => a.name);
  const cats = accounts.reduce((m, a) => ((m[a.cat] = (m[a.cat] || 0) + 1), m), {});
  console.log(`${id}: ${accounts.length} accounts`, cats, noState.length ? `NO STATES: ${noState.join(" | ")}` : "");
}
