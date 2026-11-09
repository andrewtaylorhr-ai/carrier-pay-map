// Every carrier names its categories differently; the Pay Map "Positions"
// view groups them into four position types so carriers can be compared
// side by side. The carrier's own category still shows on each account.
import type { CarrierId } from "./types";

export type Position = "Local" | "Regional" | "Dedicated" | "OTR";
export const POSITIONS: Position[] = ["Local", "Regional", "Dedicated", "OTR"];

const BY_CATEGORY: Partial<Record<CarrierId, Record<string, Position>>> = {
  jbh: { "Semi-Local": "Local", "Final Mile": "Local" },
  usx: {
    "OTR Solo Company": "OTR",
    "OTR Team Company": "OTR",
    "True Up Fleets": "OTR", // 12 days out, 2 home
    "OTR Regional": "Regional",
    "Specialized Fleets": "Regional", // mostly home weekly
    "Dedicated Home Weekly": "Dedicated",
    "Dedicated Daily/Frequently/Team": "Dedicated",
  },
  transam: { "Hiring Area": "OTR" },
  barr: { "11 North": "Regional", "OTR 18": "OTR", "OTR 21": "OTR" },
  cre: { "Home Daily / Local": "Local", "Home Weekly": "Regional", "Multi-Week OTR (Bi-Weekly+)": "OTR" },
};

export function positionOf(carrier: CarrierId, cat: string): Position {
  const p = BY_CATEGORY[carrier]?.[cat] ?? cat;
  return (POSITIONS as string[]).includes(p) ? (p as Position) : "OTR";
}
