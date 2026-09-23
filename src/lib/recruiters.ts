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
