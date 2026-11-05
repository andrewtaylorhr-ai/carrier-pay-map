"use client";

import { useEffect, useRef, useState } from "react";
import { geoAlbersUsa, geoPath, type GeoPath } from "d3-geo";
import { select, type Selection } from "d3-selection";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import { CARRIERS, MAJOR_CITIES, STATE_CITIES, STATE_CODE } from "@/lib/carriers/data";
import { getStateRecord } from "@/lib/carriers/logic";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useMapStyle } from "@/lib/hooks/useMapStyle";
import { BASE_PATH } from "@/lib/basePath";
import { renderStateLabels } from "./stateLabels";
import { Tooltip, type TooltipState } from "./Tooltip";

type StateFeature = Feature<Geometry, { name: string }>;
type PathSelection = Selection<SVGPathElement, StateFeature, SVGGElement, unknown>;

// A city marker: one per city that has accounts (see CarrierAccountsStep).
export interface MapPin {
  key: string;
  lon: number;
  lat: number;
  label: string;
  count: number;
  highlight?: boolean; // has a ticked account
  active?: boolean; // currently filtering the account list
}

interface ChoroplethMapProps {
  // zoom the map to this state (Strategy Builder)
  zoomTo?: string | null;
  // draw major reference city labels
  showCities?: boolean;
  pins?: MapPin[];
  onPinClick?: (key: string) => void;
  // hide the recruiter-name labels stamped on states
  hideStateLabels?: boolean;
}

// Same projection the states-albers-10m topojson was pre-projected with.
const PROJECT = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const VIEW_W = 975;
const VIEW_H = 610;

// D3 owns the map: paths are joined to topojson features exactly once on
// mount, then every subsequent render only pushes attribute updates through
// a D3 selection — React never re-renders the <path> list itself. This
// avoids React reconciliation cost on every hover/recolor and matches the
// original app's imperative update loop (updateMap()).
export function ChoroplethMap({ zoomTo = null, showCities = false, pins, onPinClick, hideStateLabels = false }: ChoroplethMapProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomGRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const cityGRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const pinGRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;
  const gRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const labelGRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const defsRef = useRef<Selection<SVGDefsElement, unknown, null, undefined> | null>(null);
  const pathGenRef = useRef<GeoPath>(geoPath());
  const featuresRef = useRef<StateFeature[] | null>(null);
  const statePathsRef = useRef<PathSelection | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, html: "" });
  const [mapReady, setMapReady] = useState(false);

  const {
    currentCarrier,
    currentCat,
    strategyMode,
    assignments,
    recruiterAssignments,
    recruiterColor,
    setSelectedState,
    assignModeRecruiter,
    toggleRecruiterOnState,
  } = useCarrierMap();
  const mapStyle = useMapStyle();

  // Always-current snapshot so the D3 event handlers (bound once) never read stale closures.
  const latest = useRef({
    strategyMode,
    currentCarrier,
    currentCat,
    assignments,
    recruiterAssignments,
    setSelectedState,
    assignModeRecruiter,
    toggleRecruiterOnState,
  });
  latest.current = {
    strategyMode,
    currentCarrier,
    currentCat,
    assignments,
    recruiterAssignments,
    setSelectedState,
    assignModeRecruiter,
    toggleRecruiterOnState,
  };

  // ---- Mount: build the svg + join paths to the topojson features once ----
  useEffect(() => {
    if (!containerRef.current) return;
    const container = select(containerRef.current);
    const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`)
      .attr("width", "100%");
    const defs = svg.append("defs");
    const zoomG = svg.append("g").attr("class", "zoomLayer");
    const g = zoomG.append("g");
    const labelG = zoomG.append("g").attr("class", "stateLabelsGroup");
    cityGRef.current = zoomG.append("g").attr("class", "cityLayer");
    pinGRef.current = zoomG.append("g").attr("class", "pinLayer");
    zoomGRef.current = zoomG;
    defsRef.current = defs;
    gRef.current = g;
    labelGRef.current = labelG;

    let cancelled = false;
    fetch(`${BASE_PATH}/data/states-albers-10m.json`)
      .then((r) => r.json())
      .then((us: Topology) => {
        if (cancelled) return;
        const objects = us.objects as unknown as Record<string, import("topojson-specification").GeometryCollection>;
        const features = (feature(us, objects.states) as unknown as { features: StateFeature[] }).features;
        featuresRef.current = features;

        const paths: PathSelection = g
          .selectAll<SVGPathElement, StateFeature>("path")
          .data(features)
          .join("path")
          .attr("d", pathGenRef.current)
          .on("mousemove", function (event: MouseEvent, d: StateFeature) {
            const name = d.properties.name;
            const { strategyMode, currentCarrier, currentCat, assignments, recruiterAssignments, assignModeRecruiter } =
              latest.current;
            let html = "";
            if (strategyMode && assignModeRecruiter) {
              const recs = recruiterAssignments[name] || [];
              const on = recs.includes(assignModeRecruiter);
              html =
                `<div style="font-weight:600;margin-bottom:4px">${name}</div>` +
                `<div>Recruiter${recs.length > 1 ? "s" : ""}: ${recs.length ? recs.join(", ") : "— unassigned —"}</div>` +
                `<div style="margin-top:2px;color:#7ab8f5">Click to ${on ? "remove" : "assign"} ${assignModeRecruiter}</div>`;
            } else if (strategyMode) {
              const assigned = assignments[name] || [];
              const recs = recruiterAssignments[name] || [];
              html =
                `<div style="font-weight:600;margin-bottom:4px">${name}</div>` +
                `<div>Carrier${assigned.length > 1 ? "s" : ""}: ${
                  assigned.length ? assigned.map((id) => CARRIERS[id].label).join(", ") : "— unassigned —"
                }</div>` +
                `<div>Recruiter${recs.length > 1 ? "s" : ""}: ${recs.length ? recs.join(", ") : "— unassigned —"}</div>` +
                `<div style="margin-top:2px;color:#7ab8f5">Click to assign / see all carriers</div>`;
            } else {
              const rec = getStateRecord(currentCarrier, currentCat, name);
              if (!rec) {
                setTooltip((t) => (t.visible ? { ...t, visible: false } : t));
                return;
              }
              html =
                `<div style="font-weight:600;margin-bottom:4px">${name} — ${CARRIERS[currentCarrier].label}</div>` +
                rec.tooltipLines.map((l) => `<div>${l}</div>`).join("") +
                `<div style="margin-top:4px;color:#7ab8f5">Click for details</div>`;
            }
            setTooltip({ visible: true, x: event.clientX + 14, y: event.clientY + 14, html });
          })
          .on("mouseleave", function () {
            setTooltip((t) => ({ ...t, visible: false }));
          })
          .on("click", function (_event: MouseEvent, d: StateFeature) {
            const name = d.properties.name;
            const { strategyMode, currentCarrier, currentCat, setSelectedState, assignModeRecruiter, toggleRecruiterOnState } =
              latest.current;
            if (strategyMode && assignModeRecruiter) {
              toggleRecruiterOnState(name, assignModeRecruiter);
              return;
            }
            if (!strategyMode && !getStateRecord(currentCarrier, currentCat, name)) return;
            setSelectedState(name);
          });
        statePathsRef.current = paths;
        setMapReady(true);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load states topojson", err);
      });

    return () => {
      cancelled = true;
      svg.remove();
      zoomGRef.current = null;
      cityGRef.current = null;
      pinGRef.current = null;
      gRef.current = null;
      labelGRef.current = null;
      defsRef.current = null;
      statePathsRef.current = null;
      featuresRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Restyle: push fill/stroke/opacity + gradients + labels on every style change ----
  useEffect(() => {
    const paths = statePathsRef.current;
    const defs = defsRef.current;
    const labelG = labelGRef.current;
    const features = featuresRef.current;
    if (!paths || !defs || !labelG || !features || !mapReady) return;

    defs.selectAll("linearGradient").remove();
    mapStyle.gradients.forEach(({ id, colors }) => {
      const grad = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      const n = colors.length;
      colors.forEach((color, i) => {
        grad.append("stop").attr("offset", (i / n) * 100 + "%").attr("stop-color", color);
        grad.append("stop").attr("offset", ((i + 1) / n) * 100 + "%").attr("stop-color", color);
      });
    });

    paths
      .style("cursor", (d) => mapStyle.getStyle(d.properties.name).cursor)
      .style("stroke", (d) => mapStyle.getStyle(d.properties.name).stroke)
      .style("stroke-width", (d) => mapStyle.getStyle(d.properties.name).strokeWidth)
      .attr("fill", (d) => mapStyle.getStyle(d.properties.name).fill)
      .attr("opacity", (d) => mapStyle.getStyle(d.properties.name).opacity);

    labelG.selectAll("text").remove();
    labelG.selectAll("g.stateLabelG").remove();
    const showLabels =
      !hideStateLabels && (mapStyle.legend.kind === "recruiter-filtered" || mapStyle.legend.kind === "recruiter-all");
    if (showLabels) {
      renderStateLabels(
        labelG,
        features,
        pathGenRef.current,
        recruiterAssignments,
        mapStyle.legend.kind === "recruiter-filtered" ? mapStyle.legend.name : "",
        mapStyle.getRecruiterLabel
      );
    }
  }, [mapStyle, mapReady, recruiterAssignments, recruiterColor, hideStateLabels]);

  // ---- Zoom to a state + city labels + account pins ----
  // Everything inside zoomG scales together; marker sizes and label fonts are
  // divided by the zoom factor so they stay the same size on screen.
  const pinsKey = JSON.stringify(pins ?? []);
  useEffect(() => {
    const zoomG = zoomGRef.current;
    const cityG = cityGRef.current;
    const pinG = pinGRef.current;
    const features = featuresRef.current;
    if (!zoomG || !cityG || !pinG || !features || !mapReady) return;

    let k = 1;
    let tx = 0;
    let ty = 0;
    const target = zoomTo ? features.find((f) => f.properties.name === zoomTo) : null;
    if (target) {
      const [[x0, y0], [x1, y1]] = pathGenRef.current.bounds(target);
      k = Math.min(8, 0.82 / Math.max((x1 - x0) / VIEW_W, (y1 - y0) / VIEW_H));
      tx = VIEW_W / 2 - k * ((x0 + x1) / 2);
      ty = VIEW_H / 2 - k * ((y0 + y1) / 2);
    }
    zoomG.attr("transform", `translate(${tx},${ty}) scale(${k})`);
    select(containerRef.current).classed("zoomed", k > 1);

    // Labels claim boxes (map units) as they're placed; a later label that
    // would overlap one is skipped. Busiest pins go first, then reference cities.
    const boxes: [number, number, number, number][] = [];
    const fits = (x: number, y: number, w: number, h: number) => {
      const free = !boxes.some(([bx, by, bw, bh]) => x < bx + bw && bx < x + w && y < by + bh && by < y + h);
      if (free) boxes.push([x, y, w, h]);
      return free;
    };
    const PIN_FONT = 15 / k;
    const CITY_FONT = 12.5 / k;
    const sortedPins = (pins ?? []).slice().sort((a, b) => Number(!!b.active) - Number(!!a.active) || b.count - a.count);
    const placed = sortedPins
      .map((pin) => ({ pin, p: PROJECT([pin.lon, pin.lat]) }))
      .filter((x): x is { pin: MapPin; p: [number, number] } => !!x.p)
      .map(({ pin, p }) => {
        const r = (7 + Math.min(7, Math.sqrt(pin.count) * 1.8)) / k;
        boxes.push([p[0] - r, p[1] - r, 2 * r, 2 * r]);
        return { pin, p, r };
      });
    const pinNames = new Set((pins ?? []).map((p) => p.label.toLowerCase()));

    // Try a label right of the marker, then left, above, below; null if all collide.
    const placeLabel = (p: [number, number], gap: number, w: number, font: number) => {
      const h = font * 1.1;
      const spots: { x: number; y: number; anchor: string; bx: number; by: number }[] = [
        { x: p[0] + gap, y: p[1] + font * 0.35, anchor: "start", bx: p[0] + gap, by: p[1] - font * 0.7 },
        { x: p[0] - gap, y: p[1] + font * 0.35, anchor: "end", bx: p[0] - gap - w, by: p[1] - font * 0.7 },
        { x: p[0], y: p[1] - gap - font * 0.25, anchor: "middle", bx: p[0] - w / 2, by: p[1] - gap - h },
        { x: p[0], y: p[1] + gap + font * 0.85, anchor: "middle", bx: p[0] - w / 2, by: p[1] + gap },
      ];
      return spots.find((s) => fits(s.bx, s.by, w, h)) ?? null;
    };

    // reference cities: zoomed into a state, every sizeable city there plus the
    // big ones around it; otherwise the biggest 30 in the country
    cityG.selectAll("*").remove();
    const cityLabels: { name: string; p: [number, number] }[] = [];
    if (showCities) {
      const code = zoomTo ? STATE_CODE[zoomTo] : "";
      const list: [string, number, number][] =
        k > 1
          ? [
              ...(STATE_CITIES[code] || []).map(([name, lon, lat]): [string, number, number] => [name, lon, lat]),
              ...MAJOR_CITIES.filter(([, st]) => st !== code).map(([name, , lon, lat]): [string, number, number] => [name, lon, lat]),
            ]
          : MAJOR_CITIES.slice(0, 30).map(([name, , lon, lat]) => [name, lon, lat]);
      list.forEach(([name, lon, lat]) => {
        const p = PROJECT([lon, lat]);
        if (!p || pinNames.has(name.toLowerCase())) return;
        cityLabels.push({ name, p });
      });
    }

    pinG.selectAll("*").remove();
    placed.forEach(({ pin, p, r }) => {
      const g = pinG
        .append("g")
        .attr("class", `pin${pin.highlight ? " hl" : ""}${pin.active ? " active" : ""}`)
        .style("cursor", "pointer")
        .on("click", (event: MouseEvent) => {
          event.stopPropagation();
          onPinClickRef.current?.(pin.key);
        });
      g.append("title").text(`${pin.label}: ${pin.count} account${pin.count === 1 ? "" : "s"} — click to show them`);
      g.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", r).attr("stroke-width", 1.6 / k);
      g.append("text")
        .attr("x", p[0])
        .attr("y", p[1] + 4 / k)
        .attr("font-size", 11 / k)
        .attr("text-anchor", "middle")
        .attr("class", "pinCount")
        .text(pin.count);
      const gap = r + 3 / k;
      const spot =
        placeLabel(p, gap, pin.label.length * PIN_FONT * 0.56, PIN_FONT) ??
        (pin.active ? { x: p[0] + gap, y: p[1] + PIN_FONT * 0.35, anchor: "start" } : null);
      if (spot) {
        g.append("text")
          .attr("x", spot.x)
          .attr("y", spot.y)
          .attr("text-anchor", spot.anchor)
          .attr("font-size", PIN_FONT)
          .attr("stroke-width", 3.5 / k)
          .attr("class", "pinLabel")
          .text(pin.label);
      }
    });
    // a city is drawn only if its label finds room, so the map never turns to mush
    cityLabels.forEach(({ name, p }) => {
      const dot = 3 / k;
      if (!fits(p[0] - dot, p[1] - dot, 2 * dot, 2 * dot)) return;
      const spot = placeLabel(p, 5 / k, name.length * CITY_FONT * 0.55, CITY_FONT);
      if (!spot) return;
      cityG.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", 2.6 / k).attr("class", "refCityDot");
      cityG
        .append("text")
        .attr("x", spot.x)
        .attr("y", spot.y)
        .attr("text-anchor", spot.anchor)
        .attr("font-size", CITY_FONT)
        .attr("stroke-width", 3 / k)
        .attr("class", "refCityLabel")
        .text(name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomTo, showCities, pinsKey, mapReady]);

  return (
    <>
      <div id="map" ref={containerRef} />
      <Tooltip state={tooltip} />
    </>
  );
}
