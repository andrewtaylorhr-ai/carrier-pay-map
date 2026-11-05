// Reference cities drawn on the map when it zooms into a state: every
// incorporated place (plus New England towns) with 10,000+ people, and at
// least the 15 largest in each state, biggest first.
//
// Population: US Census Bureau Vintage 2024 city/town estimates
// (sub-est2024.csv, public domain). Pass the downloaded csv once to refresh
// the compact copy in scripts/data/census-pop-2024.tsv:
//   node scripts/build-state-cities.mjs path/to/sub-est2024.csv
// Without an argument the compact copy is used. Locations come from
// scripts/data/census-places-2024.tsv (see build-cities.mjs).
//
// Writes src/lib/carriers/generated/state-cities.json
//   { [ST]: [[city, lon, lat, population], ...] }
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.join(__dirname, "..", "src", "lib", "carriers", "generated");
const POP_TSV = path.join(__dirname, "data", "census-pop-2024.tsv");
const ABBR = JSON.parse(fs.readFileSync(path.join(GEN, "us-state-abbr.json"), "utf8")); // "IL" -> "Illinois"
const NAME_TO_ABBR = Object.fromEntries(Object.entries(ABBR).map(([k, v]) => [v, k]));
const NEW_ENGLAND = new Set(["CT", "MA", "ME", "NH", "RI", "VT"]);

/* ---------- population: refresh the compact copy from the Census csv ---------- */
const src = process.argv[2];
if (src) {
  const rows = new Map();
  fs.readFileSync(src, "latin1")
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .forEach((line) => {
      const f = line.split(",");
      const [sumlev, , , , , , , funcstat, rawName, stname] = f;
      const st = NAME_TO_ABBR[stname];
      const pop = Number(f[f.length - 1]);
      // 162 = incorporated place; 061 = town (county subdivision), New England only
      if (!st || funcstat !== "A" || !(sumlev === "162" || (sumlev === "061" && NEW_ENGLAND.has(st)))) return;
      // "Lake Havasu City city" -> "Lake Havasu City"; "Indianapolis city (balance)" -> "Indianapolis"
      const name = rawName.replace(/ \(balance\)$/, "").replace(/( [a-z][a-z.]*)+$/, "");
      const key = `${name}\t${st}`;
      rows.set(key, Math.max(rows.get(key) ?? 0, pop));
    });
  const out = [...rows].sort((a, b) => b[1] - a[1]).map(([k, pop]) => `${k}\t${pop}`);
  fs.writeFileSync(POP_TSV, "name\tst\tpop\n" + out.join("\n") + "\n");
}

/* ---------- join population to locations ---------- */
const where = new Map();
fs.readFileSync(path.join(__dirname, "data", "census-places-2024.tsv"), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .forEach((line) => {
    const [name, st, lat, lon, area] = line.split("\t");
    const key = `${name}\t${st}`;
    const prev = where.get(key);
    if (!prev || Number(area) > prev.area) where.set(key, { lon: Number(lon), lat: Number(lat), area: Number(area) });
  });

const byState = {};
let missing = 0;
fs.readFileSync(POP_TSV, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .forEach((line) => {
    const [name, st, pop] = line.split("\t");
    const p = where.get(`${name}\t${st}`);
    if (!p) return void missing++;
    const label = name.replace(/^(Town|City|Village|Borough) of (the )?/, ""); // "Town of Pecos" -> "Pecos"
    (byState[st] ||= []).push([label, Number(p.lon.toFixed(4)), Number(p.lat.toFixed(4)), Number(pop)]);
  });

let total = 0;
for (const st of Object.keys(byState)) {
  const list = byState[st].sort((a, b) => b[3] - a[3]);
  byState[st] = list.filter((c, i) => i < 15 || c[3] >= 10000);
  total += byState[st].length;
}
fs.writeFileSync(path.join(GEN, "state-cities.json"), JSON.stringify(byState) + "\n");
console.log(`${total} cities in ${Object.keys(byState).length} states (${missing} population rows had no location)`);
