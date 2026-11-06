"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON as LGeoJSON, LayerGroup, Map as LMap, Path } from "leaflet";
import type { Feature, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature } from "topojson-client";
import statesTopo from "us-atlas/states-10m.json";
import { ALL_STATES, CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import type { CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { buildCoverage, COVERAGE_COLOR, COVERAGE_LABEL, coverageLevel, type StateCoverage } from "@/lib/coverage";
import { StateCoverageDetail } from "./StateCoverageDetail";
import { StatePerformancePanel } from "./StatePerformancePanel";

type StateFeature = Feature<Geometry, { name: string }>;
type Mode = "coverage" | "recruiter" | "carrier";
type Pins = "all" | "unassigned" | "off";

const topo = statesTopo as unknown as Topology<{ states: GeometryCollection<{ name: string }> }>;
// 50 states + DC only (the atlas also has Puerto Rico, Guam, …)
const FEATURES = (feature(topo, topo.objects.states) as unknown as { features: StateFeature[] }).features.filter((f) =>
  ALL_STATES.includes(f.properties.name)
);
const US_BOUNDS: [[number, number], [number, number]] = [
  [24.3, -124.8],
  [49.4, -66.9],
];
const CODE_STATE: Record<string, string> = Object.fromEntries(Object.entries(STATE_CODE).map(([n, c]) => [c, n]));
const NO_FILL = "#9aa0ad";

const segBtn = (on: boolean) =>
  `px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
    on ? "bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)]" : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
  }`;

// Team Overview map in Strategy mode: a real street map (Esri World Street
// Map tiles, Leaflet) with every state shaded by how many of its open accounts a
// recruiter has, plus a pin per account city (green = assigned, red = not).
// Clicking a state opens the full account list below the map. In Pay view the
// page keeps the original D3 pay map (StatePerformancePanel).
export function CoverageMap() {
  const {
    strategyMode,
    assignments,
    recruiterAssignments,
    recruiterAccounts,
    recruiterColor,
    recruiterFilter,
    selectedState,
    setSelectedState,
    assignModeRecruiter,
    toggleRecruiterOnState,
  } = useCarrierMap();

  const [mode, setMode] = useState<Mode>("coverage");
  const [pins, setPins] = useState<Pins>("all");
  const [carriers, setCarriers] = useState<CarrierId[]>(CARRIER_ORDER);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"open" | "az">("open");

  const coverage = useMemo(
    () => buildCoverage(assignments, recruiterAssignments, recruiterAccounts, carriers),
    [assignments, recruiterAssignments, recruiterAccounts, carriers]
  );

  const totals = useMemo(() => {
    const list = Object.values(coverage);
    const total = list.reduce((n, c) => n + c.total, 0);
    const assigned = list.reduce((n, c) => n + c.assigned, 0);
    return {
      total,
      assigned,
      open: total - assigned,
      noRecruiter: list.filter((c) => c.total && !c.recruiters.length).length,
      carrierGaps: list.reduce((n, c) => n + c.carriers.filter((k) => !k.onState && k.accounts.length).length, 0),
    };
  }, [coverage]);

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const statesRef = useRef<LGeoJSON | null>(null);
  const pinsRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);

  // latest values for Leaflet's handlers, which are bound once
  const latest = useRef({ coverage, mode, recruiterColor, recruiterFilter, selectedState, assignModeRecruiter, setSelectedState, toggleRecruiterOnState });
  latest.current = { coverage, mode, recruiterColor, recruiterFilter, selectedState, assignModeRecruiter, setSelectedState, toggleRecruiterOnState };

  // ---- mount the map once ----
  useEffect(() => {
    if (!strategyMode || !elRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current) return;
      leafletRef.current = L;
      const map = L.map(elRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        minZoom: 3,
        maxZoom: 12,
        zoomSnap: 0.25,
        preferCanvas: true,
      });
      map.fitBounds(US_BOUNDS, { padding: [8, 8] });
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS",
      }).addTo(map);
      // scroll-zoom only after the map is clicked, so the page still scrolls
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());

      statesRef.current = L.geoJSON(FEATURES as never, {
        onEachFeature: (f, layer) => {
          const name = (f as StateFeature).properties.name;
          layer.bindTooltip(() => tooltipHtml(latest.current.coverage[name], latest.current.assignModeRecruiter), {
            sticky: true,
            direction: "top",
            className: "covTip",
          });
          layer.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            map.scrollWheelZoom.enable();
            const cur = latest.current;
            if (cur.assignModeRecruiter) cur.toggleRecruiterOnState(name, cur.assignModeRecruiter);
            else cur.setSelectedState(cur.selectedState === name ? null : name);
          });
          layer.on("mouseover", () => (layer as Path).setStyle({ weight: 2.5, color: "#1c2130" }));
          layer.on("mouseout", () => statesRef.current?.resetStyle(layer));
        },
      }).addTo(map);
      pinsRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      statesRef.current = null;
      pinsRef.current = null;
      setReady(false);
    };
  }, [strategyMode]);

  // ---- state fills ----
  useEffect(() => {
    const layer = statesRef.current;
    if (!ready || !layer) return;
    layer.options.style = (f) => {
      const name = (f as StateFeature).properties.name;
      const c = coverage[name];
      const selected = selectedState === name;
      const faded = !!recruiterFilter && !c.recruiters.includes(recruiterFilter);
      let fill = NO_FILL;
      let opacity = 0.08;
      if (mode === "coverage") {
        const lvl = coverageLevel(c);
        fill = COVERAGE_COLOR[lvl];
        opacity = lvl === "empty" ? 0.06 : 0.3;
      } else if (mode === "recruiter" && c.recruiters.length) {
        fill = recruiterColor(c.recruiters[0]);
        opacity = 0.45;
      } else if (mode === "carrier") {
        const on = c.carriers.filter((k) => k.onState);
        if (on.length) {
          fill = CARRIERS[on[0].carrier].color;
          opacity = 0.45;
        }
      }
      return {
        fillColor: fill,
        fillOpacity: faded ? 0.04 : opacity,
        color: selected ? "#d4a137" : "#ffffff",
        weight: selected ? 3.5 : 1.2,
        opacity: 1,
        dashArray: mode === "recruiter" && c.recruiters.length > 1 ? "5 4" : undefined,
      };
    };
    layer.setStyle(layer.options.style);
    // keep the selected outline on top
    layer.eachLayer((l) => {
      if ((l as unknown as { feature: StateFeature }).feature.properties.name === selectedState) (l as Path).bringToFront();
    });
  }, [ready, coverage, mode, recruiterColor, recruiterFilter, selectedState]);

  // ---- account pins ----
  useEffect(() => {
    const L = leafletRef.current;
    const group = pinsRef.current;
    if (!ready || !L || !group) return;
    group.clearLayers();
    if (pins === "off") return;
    for (const c of Object.values(coverage)) {
      if (recruiterFilter && !c.recruiters.includes(recruiterFilter)) continue;
      const code = STATE_CODE[c.state];
      for (const k of c.carriers) {
        for (const { account, recruiters } of k.accounts) {
          if (pins === "unassigned" && recruiters.length) continue;
          for (const city of account.cities) {
            if (city.st !== code) continue;
            const marker = L.circleMarker([city.lat, city.lon], {
              radius: 5,
              color: "#ffffff",
              weight: 1.5,
              fillColor: recruiters.length ? "#16a34a" : "#e5484d",
              fillOpacity: 0.95,
            });
            marker.bindTooltip(
              `<b>${esc(account.name)}</b><br><span style="color:${CARRIERS[k.carrier].color}">●</span> ${esc(CARRIERS[k.carrier].label)} · ${esc(
                account.cat
              )}<br>${esc(city.name)}, ${city.st}<br>${
                recruiters.length ? `Assigned: <b>${esc(recruiters.join(", "))}</b>` : '<b style="color:#e5484d">Not assigned</b>'
              }`,
              { direction: "top", className: "covTip" }
            );
            marker.on("click", () => latest.current.setSelectedState(CODE_STATE[city.st] ?? c.state));
            group.addLayer(marker);
          }
        }
      }
    }
  }, [ready, coverage, pins, recruiterFilter]);

  // ---- zoom to the selected state ----
  useEffect(() => {
    const map = mapRef.current;
    const layer = statesRef.current;
    if (!ready || !map || !layer) return;
    if (!selectedState) {
      map.flyToBounds(US_BOUNDS, { padding: [8, 8], duration: 0.6 });
      return;
    }
    layer.eachLayer((l) => {
      if ((l as unknown as { feature: StateFeature }).feature.properties.name === selectedState)
        map.flyToBounds((l as unknown as LGeoJSON).getBounds(), { padding: [30, 30], maxZoom: 7, duration: 0.6 });
    });
  }, [ready, selectedState]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(coverage)
      .filter((c) => !q || c.state.toLowerCase().includes(q) || STATE_CODE[c.state]?.toLowerCase() === q)
      .filter((c) => !recruiterFilter || c.recruiters.includes(recruiterFilter))
      .sort((a, b) => (sort === "az" ? a.state.localeCompare(b.state) : b.total - b.assigned - (a.total - a.assigned) || a.state.localeCompare(b.state)));
  }, [coverage, query, sort, recruiterFilter]);

  if (!strategyMode) return <StatePerformancePanel />;

  const allCarriers = carriers.length === CARRIER_ORDER.length;
  const toggleCarrier = (id: CarrierId) =>
    setCarriers((prev) => (allCarriers ? [id] : prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : CARRIER_ORDER) : [...prev, id]));

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 pt-4">
      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
        {/* header */}
        <div className="flex items-center gap-x-5 gap-y-2.5 flex-wrap px-4 py-3 border-b border-[var(--cpm-border)]">
          <div className="text-[14px] font-semibold text-[var(--cpm-text)]">Account coverage map</div>
          <div className="flex items-center gap-0.5 p-[3px] rounded-lg bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)]">
            {(
              [
                ["coverage", "Coverage"],
                ["recruiter", "Recruiters"],
                ["carrier", "Carriers"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button key={m} type="button" className={segBtn(mode === m)} onClick={() => setMode(m)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 p-[3px] rounded-lg bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)]">
            <span className="px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">Pins</span>
            {(
              [
                ["all", "All accounts"],
                ["unassigned", "Not assigned"],
                ["off", "Off"],
              ] as [Pins, string][]
            ).map(([p, label]) => (
              <button key={p} type="button" className={segBtn(pins === p)} onClick={() => setPins(p)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setCarriers(CARRIER_ORDER)}
              className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold border ${
                allCarriers ? "bg-[var(--cpm-accent)] border-[var(--cpm-accent)] text-[var(--cpm-accent-ink)]" : "border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)]"
              }`}
            >
              All carriers
            </button>
            {CARRIER_ORDER.map((id) => {
              const on = !allCarriers && carriers.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCarrier(id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border transition-colors"
                  style={
                    on
                      ? { background: CARRIERS[id].color, borderColor: CARRIERS[id].color, color: "#fff" }
                      : { borderColor: "var(--cpm-border-strong)", color: "var(--cpm-text-dim)" }
                  }
                >
                  {!on && <i className="w-2 h-2 rounded-full inline-block" style={{ background: CARRIERS[id].color }} />}
                  {CARRIERS[id].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* totals */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[var(--cpm-border)]">
          <Stat label="Open accounts" value={totals.total} sub="all states, picked carriers" />
          <Stat label="Assigned" value={totals.assigned} color="var(--cpm-green)" sub={pct(totals.assigned, totals.total)} />
          <Stat label="Not assigned" value={totals.open} color="#ff8a8e" sub={pct(totals.open, totals.total)} />
          <Stat label="States without recruiter" value={totals.noRecruiter} color="#ff8a8e" sub="that have open accounts" />
          <Stat label="Carrier gaps" value={totals.carrierGaps} color="#f5b84a" sub="carrier hiring, not assigned to state" />
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* map */}
          <div className="flex-1 min-w-0 p-3">
            <div className="relative rounded-lg overflow-hidden border border-[var(--cpm-border)]">
              <div ref={elRef} className="h-[620px] w-full bg-[#e9eef2]" />
              {assignModeRecruiter && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-full bg-[#1c2130] text-white text-[12px] font-semibold shadow-lg">
                  Click states to assign / remove {assignModeRecruiter}
                </div>
              )}
              <div className="absolute bottom-6 left-2 z-[500] rounded-md bg-white/95 shadow-md px-2.5 py-1.5 text-[11px] text-[#1c2130] max-w-[58%]">
                <Legend mode={mode} pins={pins} coverage={coverage} recruiterColor={recruiterColor} />
              </div>
            </div>
            <div className="mt-1.5 text-[11px] text-[var(--cpm-text-faint)]">
              Click a state for its full account list. Click the map first, then scroll to zoom; drag to move. Hover a pin for the account.
            </div>
          </div>

          {/* state list */}
          <div className="lg:w-[330px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--cpm-border)] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search state…"
                className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none placeholder:text-[var(--cpm-text-faint)]"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "open" | "az")}
                className="h-8 px-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12px] text-[var(--cpm-text)]"
              >
                <option value="open">Most not assigned</option>
                <option value="az">A – Z</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[600px] pr-0.5">
              {list.map((c) => (
                <StateRow key={c.state} c={c} active={selectedState === c.state} onClick={() => setSelectedState(selectedState === c.state ? null : c.state)} recruiterColor={recruiterColor} />
              ))}
              {!list.length && <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">No states match.</div>}
            </div>
          </div>
        </div>
      </div>

      {selectedState && coverage[selectedState] && (
        <StateCoverageDetail c={coverage[selectedState]} onClose={() => setSelectedState(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  return (
    <div className="px-4 py-3 border-r last:border-r-0 border-[var(--cpm-border)]">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">{label}</div>
      <div className="text-[22px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: color ?? "var(--cpm-text)" }}>
        {value.toLocaleString("en-US")}
      </div>
      <div className="text-[11px] text-[var(--cpm-text-faint)]">{sub}</div>
    </div>
  );
}

function StateRow({
  c,
  active,
  onClick,
  recruiterColor,
}: {
  c: StateCoverage;
  active: boolean;
  onClick: () => void;
  recruiterColor: (name: string) => string;
}) {
  const lvl = coverageLevel(c);
  const open = c.total - c.assigned;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-2.5 py-2 rounded-lg border transition-colors ${
        active ? "bg-[rgba(212,161,55,0.12)] border-[var(--cpm-accent)]" : "border-transparent hover:bg-[var(--cpm-panel-alt)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[12.5px] font-semibold ${active ? "text-[var(--cpm-accent-strong)]" : "text-[var(--cpm-text)]"}`}>{c.state}</span>
        <span className="text-[11px] tabular-nums" style={{ color: lvl === "empty" ? "var(--cpm-text-faint)" : COVERAGE_COLOR[lvl] }}>
          {c.total ? (open ? `${open} not assigned` : "all assigned") : "no accounts"}
        </span>
      </div>
      {c.total > 0 && (
        <div className="mt-1 h-1.5 rounded-full bg-[rgba(229,72,77,0.35)] overflow-hidden">
          <div className="h-full bg-[#16a34a]" style={{ width: `${(c.assigned / c.total) * 100}%` }} />
        </div>
      )}
      <div className="mt-1 text-[11px] text-[var(--cpm-text-faint)] truncate">
        {c.recruiters.length ? (
          c.recruiters.map((r, i) => (
            <span key={r}>
              {i > 0 && ", "}
              <span style={{ color: recruiterColor(r) }}>●</span> {r}
            </span>
          ))
        ) : (
          <span className="text-[#ff9a9d]">No recruiter</span>
        )}
        <span className="text-[var(--cpm-text-faint)]"> · {c.assigned}/{c.total}</span>
      </div>
    </button>
  );
}

function Legend({
  mode,
  pins,
  coverage,
  recruiterColor,
}: {
  mode: Mode;
  pins: Pins;
  coverage: Record<string, StateCoverage>;
  recruiterColor: (name: string) => string;
}) {
  const sw = (color: string, label: string) => (
    <span key={label} className="flex items-center gap-1.5 whitespace-nowrap">
      <i className="w-3 h-3 rounded-sm inline-block" style={{ background: color, opacity: 0.75 }} />
      {label}
    </span>
  );
  let items: React.ReactNode[] = [];
  if (mode === "coverage") items = (["full", "partial", "none", "empty"] as const).map((l) => sw(COVERAGE_COLOR[l], COVERAGE_LABEL[l]));
  else if (mode === "recruiter") {
    const names = [...new Set(Object.values(coverage).flatMap((c) => c.recruiters.slice(0, 1)))].sort();
    items = [...names.map((n) => sw(recruiterColor(n), n)), <span key="dash">dashed border = shared state</span>];
  } else {
    const ids = CARRIER_ORDER.filter((id) => Object.values(coverage).some((c) => c.carriers.some((k) => k.onState && k.carrier === id)));
    items = [...ids.map((id) => sw(CARRIERS[id].color, CARRIERS[id].label)), <span key="first">color = first carrier on state</span>];
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap">{items}</div>
      {pins !== "off" && (
        <div className="flex items-center gap-3 border-t border-black/10 pt-1">
          {pins === "all" && (
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 rounded-full inline-block bg-[#16a34a] ring-1 ring-white" /> Account assigned
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-[#e5484d] ring-1 ring-white" /> Account not assigned
          </span>
        </div>
      )}
    </div>
  );
}

function tooltipHtml(c: StateCoverage | undefined, assignRecruiter: string | null): string {
  if (!c) return "";
  const open = c.total - c.assigned;
  const carriers = c.carriers
    .map(
      (k) =>
        `<div><span style="color:${CARRIERS[k.carrier].color}">●</span> ${esc(CARRIERS[k.carrier].label)}: ${k.assigned}/${k.accounts.length}${
          k.onState ? "" : ' <span style="color:#e5484d">(carrier not assigned)</span>'
        }</div>`
    )
    .join("");
  return `<div style="min-width:190px"><div style="font-weight:700;font-size:13px">${esc(c.state)}</div>
<div>${c.recruiters.length ? "Recruiters: <b>" + esc(c.recruiters.join(", ")) + "</b>" : '<b style="color:#e5484d">No recruiter</b>'}</div>
<div>${c.total} open accounts · <b style="color:#16a34a">${c.assigned} assigned</b> · <b style="color:#e5484d">${open} not</b></div>
${carriers ? `<div style="margin-top:4px">${carriers}</div>` : ""}
${assignRecruiter ? `<div style="margin-top:4px;color:#2563eb">Click to ${c.recruiters.includes(assignRecruiter) ? "remove" : "assign"} ${esc(assignRecruiter)}</div>` : ""}</div>`;
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}% of open accounts` : "—");
const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
