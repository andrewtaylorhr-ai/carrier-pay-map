"use client";

import { useEffect, useRef, useState } from "react";
import { geoPath, type GeoPath } from "d3-geo";
import { select, type Selection } from "d3-selection";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import { CARRIERS } from "@/lib/carriers/data";
import { getStateRecord } from "@/lib/carriers/logic";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useMapStyle } from "@/lib/hooks/useMapStyle";
import { BASE_PATH } from "@/lib/basePath";
import { renderStateLabels } from "./stateLabels";
import { Tooltip, type TooltipState } from "./Tooltip";

type StateFeature = Feature<Geometry, { name: string }>;
type PathSelection = Selection<SVGPathElement, StateFeature, SVGGElement, unknown>;

// D3 owns the map: paths are joined to topojson features exactly once on
// mount, then every subsequent render only pushes attribute updates through
// a D3 selection — React never re-renders the <path> list itself. This
// avoids React reconciliation cost on every hover/recolor and matches the
// original app's imperative update loop (updateMap()).
export function ChoroplethMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const labelGRef = useRef<Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const defsRef = useRef<Selection<SVGDefsElement, unknown, null, undefined> | null>(null);
  const pathGenRef = useRef<GeoPath>(geoPath());
  const featuresRef = useRef<StateFeature[] | null>(null);
  const statePathsRef = useRef<PathSelection | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, html: "" });
  const [mapReady, setMapReady] = useState(false);

  const { currentCarrier, currentCat, strategyMode, assignments, recruiterAssignments, recruiterColor, setSelectedState } =
    useCarrierMap();
  const mapStyle = useMapStyle();

  // Always-current snapshot so the D3 event handlers (bound once) never read stale closures.
  const latest = useRef({ strategyMode, currentCarrier, currentCat, assignments, recruiterAssignments, setSelectedState });
  latest.current = { strategyMode, currentCarrier, currentCat, assignments, recruiterAssignments, setSelectedState };

  // ---- Mount: build the svg + join paths to the topojson features once ----
  useEffect(() => {
    if (!containerRef.current) return;
    const container = select(containerRef.current);
    const svg = container
      .append("svg")
      .attr("viewBox", "0 0 975 610")
      .attr("width", "100%")
      .attr("height", "auto");
    const defs = svg.append("defs");
    const g = svg.append("g");
    const labelG = svg.append("g").attr("class", "stateLabelsGroup");
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
            const { strategyMode, currentCarrier, currentCat, assignments, recruiterAssignments } = latest.current;
            let html = "";
            if (strategyMode) {
              const assigned = assignments[name];
              const recs = recruiterAssignments[name] || [];
              html =
                `<div style="font-weight:600;margin-bottom:4px">${name}</div>` +
                `<div>Carrier: ${assigned ? CARRIERS[assigned].label : "— unassigned —"}</div>` +
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
            const { strategyMode, currentCarrier, currentCat, setSelectedState } = latest.current;
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
    mapStyle.gradients.forEach(({ id, names }) => {
      const grad = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      const n = names.length;
      names.forEach((name, i) => {
        grad.append("stop").attr("offset", (i / n) * 100 + "%").attr("stop-color", recruiterColor(name));
        grad.append("stop").attr("offset", ((i + 1) / n) * 100 + "%").attr("stop-color", recruiterColor(name));
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
    const showLabels = mapStyle.legend.kind === "recruiter-filtered" || mapStyle.legend.kind === "recruiter-all";
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
  }, [mapStyle, mapReady, recruiterAssignments, recruiterColor]);

  return (
    <>
      <div id="map" ref={containerRef} />
      <Tooltip state={tooltip} />
    </>
  );
}
