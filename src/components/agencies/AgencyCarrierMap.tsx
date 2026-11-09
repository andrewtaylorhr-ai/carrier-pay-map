"use client";

import { useMemo, useState } from "react";
import { interpolateRgb } from "d3-interpolate";
import { ChoroplethMap, type MapPaint } from "@/components/carrier-map/ChoroplethMap";
import { AGENCY_CARRIERS, type AgencyCarrier, type Fleet } from "@/lib/agency-carriers";
import type { Agency } from "@/lib/agencies";
import { ALL_STATES } from "@/lib/carriers/data";

const NO_DATA_FILL = "#232733";
const LOW_FILL = "#2c3446";
const label = "text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]";
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// "$0.55 CPM" or a range, "$0.67–$0.71 CPM"
function cpmOf(f: Fleet): [number, number] | null {
  const m = /\$(\d*\.\d+)(?:\s*[–-]\s*\$(\d*\.\d+))? CPM/.exec(f.payText);
  return m ? [Number(m[1]), Number(m[2] ?? m[1])] : null;
}

type StatePay = { fleets: Fleet[]; weekMin: number | null; weekMax: number | null; cpmMin: number | null; cpmMax: number | null };

function statePay(fleets: Fleet[], state: string): StatePay | null {
  const list = fleets.filter((f) => f.states.includes(state));
  if (!list.length) return null;
  const p: StatePay = { fleets: list, weekMin: null, weekMax: null, cpmMin: null, cpmMax: null };
  list.forEach((f) => {
    if (f.payLow != null) p.weekMin = Math.min(p.weekMin ?? f.payLow, f.payLow);
    if (f.payHigh != null) p.weekMax = Math.max(p.weekMax ?? f.payHigh, f.payHigh);
    const c = cpmOf(f);
    if (c) {
      p.cpmMin = Math.min(p.cpmMin ?? c[0], c[0]);
      p.cpmMax = Math.max(p.cpmMax ?? c[1], c[1]);
    }
  });
  return p;
}

const payRange = (p: StatePay) =>
  [
    p.weekMin != null && p.weekMax != null && (p.weekMin === p.weekMax ? `${usd(p.weekMax)}/wk` : `${usd(p.weekMin)} – ${usd(p.weekMax)}/wk`),
    p.cpmMin != null && p.cpmMax != null && `$${p.cpmMin.toFixed(2)} – $${p.cpmMax.toFixed(2)} CPM`,
  ]
    .filter(Boolean)
    .join(" · ") || "pay not listed";

// Pay map for the carriers only our agencies work (Barr-Nunn…): each state
// shows the top estimated weekly pay, click it for the fleets hiring there.
export function AgencyCarrierMap({ agencies }: { agencies: Agency[] }) {
  const [carrierId, setCarrierId] = useState(AGENCY_CARRIERS[0]?.id ?? "");
  const carrier = AGENCY_CARRIERS.find((c) => c.id === carrierId) ?? AGENCY_CARRIERS[0];
  if (!carrier) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-[16px] font-bold text-[var(--cpm-text)] mr-2">Agency carriers map</h2>
        {AGENCY_CARRIERS.map((c) => {
          const active = c.id === carrier.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`carrierToggle${active ? " on" : ""}`}
              style={active ? { borderColor: c.color, color: c.color, background: `${c.color}1f` } : undefined}
              onClick={() => setCarrierId(c.id)}
              aria-pressed={active}
            >
              <span className="dot" style={{ background: active ? c.color : "transparent", borderColor: c.color }} />
              {c.label}
            </button>
          );
        })}
      </div>
      <CarrierMap key={carrier.id} carrier={carrier} agencies={agencies} />
    </div>
  );
}

function CarrierMap({ carrier, agencies }: { carrier: AgencyCarrier; agencies: Agency[] }) {
  const [cat, setCat] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const fleets = useMemo(() => carrier.fleets.filter((f) => !cat || f.cat === cat), [carrier, cat]);
  const working = agencies.filter((a) => a.status !== "stopped" && a.carriers.includes(carrier.id));

  const pay = useMemo(() => Object.fromEntries(ALL_STATES.map((s) => [s, statePay(fleets, s)])) as Record<string, StatePay | null>, [fleets]);
  const states = ALL_STATES.filter((s) => pay[s]);
  const weekly = states.map((s) => pay[s]!.weekMax).filter((v): v is number => v != null);
  const maxPay = weekly.length ? Math.max(...weekly) : null;
  const topLow = weekly.length ? Math.min(...weekly) : 0;
  const lowest = states.map((s) => pay[s]!.weekMin).filter((v): v is number => v != null);
  const minPay = lowest.length ? Math.min(...lowest) : null;

  const paint = useMemo<MapPaint>(() => {
    const shade = interpolateRgb(LOW_FILL, carrier.color);
    const span = (maxPay ?? 0) - topLow;
    return {
      selected,
      fill: (s) => {
        const p = pay[s];
        if (!p) return NO_DATA_FILL;
        if (p.weekMax == null || !span) return shade(0.45);
        return shade(0.3 + (0.7 * (p.weekMax - topLow)) / span);
      },
      label: (s) => {
        const p = pay[s];
        if (!p) return null;
        if (p.weekMax != null) return usd(p.weekMax);
        if (p.cpmMax != null) return `$${p.cpmMax.toFixed(2)}/mi`;
        return null;
      },
      tooltip: (s) => {
        const p = pay[s];
        if (!p) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No ${carrier.label} account hires here</div>`;
        return (
          `<div style="font-weight:700;margin-bottom:2px">${s}</div>` +
          `<div>${payRange(p)}</div>` +
          `<div style="color:#9aa0ad">${p.fleets.length} account${p.fleets.length === 1 ? "" : "s"}: ${p.fleets
            .slice(0, 4)
            .map((f) => f.name)
            .join(", ")}${p.fleets.length > 4 ? "…" : ""}</div>` +
          `<div style="margin-top:3px;color:#7ab8f5">Click for the accounts below the map</div>`
        );
      },
      onClick: (s) => setSelected(pay[s] ? s : null),
    };
  }, [pay, selected, carrier, maxPay, topLow]);

  const sel = selected ? pay[selected] : null;
  const openings = fleets.reduce((n, f) => n + (f.openings ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="segTabs">
          {["", ...carrier.cats].map((c) => (
            <button key={c || "all"} type="button" className={cat === c ? "active" : undefined} onClick={() => setCat(c)}>
              {c || "All"} <span className="opacity-60">{c ? carrier.fleets.filter((f) => f.cat === c).length : carrier.fleets.length}</span>
            </button>
          ))}
        </div>
        <div className="offerTotal">
          <b>{fleets.length}</b> {fleets.length === 1 ? "account" : "accounts"} · <b>{states.length}</b> states
          {openings > 0 && (
            <>
              {" "}· <b>{openings}</b> openings
            </>
          )}
          {maxPay != null && minPay != null && (
            <>
              {" "}· pay <b>{usd(minPay)}</b> – <b>{usd(maxPay)}</b>/wk
            </>
          )}
        </div>
        <span className="text-[12px] text-[var(--cpm-text-dim)]">
          Agencies working it: {working.length ? working.map((a) => a.name).join(", ") : <span className="text-[var(--cpm-text-faint)]">none yet</span>}
        </span>
        <button type="button" className="ghostBtn ml-auto" onClick={() => setShowInfo((v) => !v)}>
          {showInfo ? "Hide" : "Show"} {carrier.label} info
        </button>
      </div>

      {showInfo && (
        <div
          className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--cpm-text-dim)] [&_b]:text-[var(--cpm-text)]"
          dangerouslySetInnerHTML={{ __html: carrier.note }}
        />
      )}

      <div className="wizCard">
        <div className="max-w-[960px] mx-auto">
          <ChoroplethMap paint={paint} />
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap mt-2 text-[12px] text-[var(--cpm-text-dim)]">
          <span>Number = highest weekly pay in the state (per mile where no weekly pay is given)</span>
          <span className="flex items-center gap-1.5">
            lower
            <span
              className="w-[90px] h-[9px] rounded inline-block"
              style={{ background: `linear-gradient(90deg, ${interpolateRgb(LOW_FILL, carrier.color)(0.3)}, ${carrier.color})` }}
            />
            higher
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: NO_DATA_FILL, border: "1px solid #555" }} /> not hiring
          </span>
        </div>
      </div>

      <div className="wizCard min-w-0 !min-h-0">
        {!sel || !selected ? (
          <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-4 text-center">Click a state on the map to see its {carrier.label} accounts here.</div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <div className="text-[17px] font-bold text-[var(--cpm-text)]">
                {selected} <span className="text-[13px] font-semibold text-[var(--cpm-text-dim)]">· {payRange(sel)}</span>
              </div>
              <div className="text-[12px] text-[var(--cpm-text-faint)]">
                {sel.fleets.length} account{sel.fleets.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 items-start">
              {sel.fleets.map((f) => (
                <FleetCard key={f.id} f={f} state={selected} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FleetCard({ f, state }: { f: Fleet; state: string }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold text-[var(--cpm-text)]">{f.name}</span>
        <span className="ml-auto catTag">{f.cat}</span>
      </div>
      <div className="text-[13px] font-semibold" style={{ color: f.payText.startsWith("Pay not") ? "#ff9a9d" : "var(--cpm-green)" }}>
        {f.payText}
      </div>
      {(f.openings != null || f.bonus) && (
        <div className="text-[12.5px] text-[var(--cpm-text)]">
          {f.openings != null && (
            <>
              <span className="text-[var(--cpm-text-faint)]">Openings: </span>
              <b>{f.openings}</b>
            </>
          )}
          {f.openings != null && f.bonus && " · "}
          {f.bonus && (
            <>
              <span className="text-[var(--cpm-text-faint)]">Sign-on: </span>
              {f.bonus}
            </>
          )}
        </div>
      )}
      <div className="text-[12.5px] text-[var(--cpm-text)]">
        <span className="text-[var(--cpm-text-faint)]">Home time: </span>
        {f.hometime}
      </div>
      <div className="text-[12px] text-[var(--cpm-text-dim)]">{f.notes}</div>
      <div className={`${label} mt-1`}>Hiring states ({f.states.length})</div>
      <div className="flex flex-wrap gap-1">
        {f.states.map((s) => (
          <span
            key={s}
            className={`text-[11px] px-1.5 py-px rounded border ${
              s === state ? "border-[var(--cpm-accent)] text-[var(--cpm-accent)]" : "border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)]"
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
