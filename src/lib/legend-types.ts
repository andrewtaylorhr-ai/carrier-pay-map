import type { CarrierId } from "@/lib/carriers/types";

export type LegendSpec =
  | { kind: "recruiter-filtered"; name: string; color: string }
  | { kind: "recruiter-all"; items: { name: string; color: string }[] }
  | { kind: "carrier-assign"; items: { id: CarrierId; label: string; color: string }[] }
  | { kind: "binary"; carrierColor: string }
  | {
      kind: "gradient";
      minLabel: string;
      maxLabel: string;
      minColor: string;
      maxColor: string;
      hasData: boolean;
      // overrides the default pay-view caption text below the gradient bar
      // (e.g. for the "Hires" map color mode); falls back to the pay-view
      // text when omitted.
      hint?: string;
    }
  | { kind: "empty" };
