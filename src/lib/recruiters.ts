// Ported from the original HTML's recruiter roster + color-palette logic.
import { schemeSet3, schemeTableau10 } from "d3-scale-chromatic";
import { scaleOrdinal } from "d3-scale";

export const DEFAULT_RECRUITERS: string[] = [
  "Ron",
  "William",
  "Kevin",
  "James",
  "Lucas",
  "Michael",
  "Jason",
  "Jordan",
  "Alex",
  "Cris",
  "Nolan",
  "Frank",
  "Kate",
  "Lewis",
  "Daniel",
  "Brian",
  "Brandon",
  "Tyler",
  "Mark",
  "Ethan",
  "Jack",
];

export const RECRUITER_TARGET = 5;

export function buildRecruiterPalette(n: number): string[] {
  const base = (schemeTableau10 as readonly string[]).concat(schemeSet3 as readonly string[]);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

// Builds a name -> color lookup function, matching d3.scaleOrdinal().domain(names).range(palette).
export function buildRecruiterColorScale(names: string[]): (name: string) => string {
  const palette = buildRecruiterPalette(names.length);
  const scale = scaleOrdinal<string, string>().domain(names).range(palette);
  return (name: string) => scale(name);
}

export function recruiterGradId(names: string[]): string {
  return "grad-" + names.slice().sort().map((n) => n.replace(/[^a-z0-9]/gi, "")).join("-");
}

// Shared month-key convention for recruiterActuals: a stable "YYYY-MM" key
// (unaffected by locale) paired with a locale-formatted display label
// ("Sep 2026"). Used by both MonthlyTargetActualTable (single recruiter)
// and the /reports page (all recruiters) so they always read/write the
// same storage key for "this month" / "next month".
export interface MonthOption {
  key: string;
  label: string;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentAndNextMonth(): MonthOption[] {
  const now = new Date();
  return [0, 1].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { key: monthKey(d), label: d.toLocaleDateString(undefined, { month: "short", year: "numeric" }) };
  });
}
