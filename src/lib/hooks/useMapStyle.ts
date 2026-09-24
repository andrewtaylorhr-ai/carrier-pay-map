"use client";

import { useMemo } from "react";
import { max as d3max, min as d3min } from "d3-array";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { ALL_STATES, CARRIERS, CARRIER_ORDER } from "@/lib/carriers/data";
import { getStateRecord, isFlatCategory } from "@/lib/carriers/logic";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { recruiterGradId } from "@/lib/recruiters";
import type { LegendSpec } from "@/lib/legend-types";

export interface StateStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  cursor: "pointer" | "default";
}

export interface GradientSpec {
  id: string;
  names: string[];
}

export interface MapStyle {
  legend: LegendSpec;
  getStyle: (stateName: string) => StateStyle;
  gradients: GradientSpec[];
  getRecruiterLabel: (stateName: string) => string;
}

const UNASSIGNED_FILL = "#232733";
const NO_DATA_FILL = "#232733";
const NO_VALUE_FILL = "#3a4a63";
const FLAT_NO_FILL = "#6b3a3a";
const DEFAULT_STROKE = "rgba(255,255,255,0.18)";

export function useMapStyle(): MapStyle {
  const {
    currentCarrier,
    currentCat,
    strategyMode,
    colorMode,
    recruiterFilter,
    assignments,
    recruiters,
    recruiterColor,
    recruiterAssignments,
  } = useCarrierMap();

  const gradients = useMemo<GradientSpec[]>(() => {
    const combos = new Map<string, string[]>();
    Object.keys(recruiterAssignments).forEach((state) => {
      const arr = recruiterAssignments[state] || [];
      if (arr.length > 1) {
        const sorted = arr.slice().sort();
        combos.set(recruiterGradId(sorted), sorted);
      }
    });
    return Array.from(combos.entries()).map(([id, names]) => ({ id, names }));
  }, [recruiterAssignments]);

  return useMemo<MapStyle>(() => {
    // ---- Strategy mode ----
    if (strategyMode) {
      if (colorMode === "recruiter") {
        const getStyle = (stateName: string): StateStyle => {
          const arr = recruiterAssignments[stateName] || [];
          const shared = arr.length > 1;
          let fill = UNASSIGNED_FILL;
          if (arr.length) {
            if (recruiterFilter) fill = arr.includes(recruiterFilter) ? recruiterColor(recruiterFilter) : "#e3e2de";
            else if (shared) fill = `url(#${recruiterGradId(arr)})`;
            else fill = recruiterColor(arr[0]);
          }
          const opacity = recruiterFilter ? (arr.includes(recruiterFilter) ? 1 : 0.4) : 1;
          return {
            fill,
            stroke: shared ? "#1a1a1a" : DEFAULT_STROKE,
            strokeWidth: shared ? 1.6 : 0.75,
            opacity,
            cursor: "pointer",
          };
        };
        const legend: LegendSpec = recruiterFilter
          ? { kind: "recruiter-filtered", name: recruiterFilter, color: recruiterColor(recruiterFilter) }
          : { kind: "recruiter-all", items: recruiters.map((r) => ({ name: r, color: recruiterColor(r) })) };
        return { legend, getStyle, gradients, getRecruiterLabel: makeRecruiterLabelFn(recruiterAssignments, recruiterFilter) };
      }
      // colorMode === 'carrier'
      const getStyle = (stateName: string): StateStyle => {
        const a = assignments[stateName];
        return {
          fill: a ? CARRIERS[a].color : UNASSIGNED_FILL,
          stroke: DEFAULT_STROKE,
          strokeWidth: 0.75,
          opacity: 1,
          cursor: "pointer",
        };
      };
      const legend: LegendSpec = {
        kind: "carrier-assign",
        items: CARRIER_ORDER.map((id) => ({ id, label: CARRIERS[id].label, color: CARRIERS[id].color })),
      };
      return { legend, getStyle, gradients, getRecruiterLabel: () => "" };
    }

    // ---- Pay / coverage view ----
    const flat = isFlatCategory(currentCarrier, currentCat);
    if (flat) {
      const getStyle = (stateName: string): StateStyle => {
        const rec = getStateRecord(currentCarrier, currentCat, stateName);
        return {
          fill: !rec ? NO_DATA_FILL : rec.flatNo ? FLAT_NO_FILL : CARRIERS[currentCarrier].color,
          stroke: DEFAULT_STROKE,
          strokeWidth: 0.75,
          opacity: rec ? 1 : 0.35,
          cursor: rec ? "pointer" : "default",
        };
      };
      const legend: LegendSpec = { kind: "binary", carrierColor: CARRIERS[currentCarrier].color };
      return { legend, getStyle, gradients: [], getRecruiterLabel: () => "" };
    }

    const vals: number[] = [];
    ALL_STATES.forEach((s) => {
      const rec = getStateRecord(currentCarrier, currentCat, s);
      if (rec && rec.value != null) vals.push(rec.value);
    });
    const min = vals.length ? (d3min(vals) ?? 0) : 0;
    const max = vals.length ? (d3max(vals) ?? 1) : 1;
    const domainMin = min * 0.9 || 0;
    const domainMax = max * 1.05 || 1;
    const color = scaleSequential(interpolateBlues).domain([domainMin, domainMax]);

    const getStyle = (stateName: string): StateStyle => {
      const rec = getStateRecord(currentCarrier, currentCat, stateName);
      let fill = NO_DATA_FILL;
      if (rec) fill = rec.value == null ? NO_VALUE_FILL : color(rec.value);
      return {
        fill,
        stroke: DEFAULT_STROKE,
        strokeWidth: 0.75,
        opacity: rec ? 1 : 0.35,
        cursor: rec ? "pointer" : "default",
      };
    };

    const fmt = (n: number) => (currentCarrier === "swift" ? "$" + n.toLocaleString() + "/wk" : "$" + n.toFixed(2) + "/mi");
    const legend: LegendSpec = {
      kind: "gradient",
      minLabel: vals.length ? fmt(min) : "n/a",
      maxLabel: vals.length ? fmt(max) : "",
      minColor: color(domainMin),
      maxColor: color(domainMax),
      hasData: vals.length > 0,
    };
    return { legend, getStyle, gradients: [], getRecruiterLabel: () => "" };
  }, [
    strategyMode,
    colorMode,
    recruiterFilter,
    assignments,
    recruiters,
    recruiterColor,
    recruiterAssignments,
    currentCarrier,
    currentCat,
    gradients,
  ]);
}

function makeRecruiterLabelFn(
  recruiterAssignments: Record<string, string[]>,
  recruiterFilter: string
): (stateName: string) => string {
  return (stateName: string) => {
    const arr = recruiterAssignments[stateName] || [];
    const shown = recruiterFilter ? [recruiterFilter] : arr;
    return shown.length <= 2 ? shown.join(", ") : `${shown[0]} +${shown.length - 1}`;
  };
}
