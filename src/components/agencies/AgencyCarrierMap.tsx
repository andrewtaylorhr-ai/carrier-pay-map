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

// One account, with the carrier it belongs to.
type Item = Fleet & { carrier: AgencyCarrier };

// Accounts grouped into Local / Regional / OTR / Jockey when several
// carriers are shown (each carrier names its categories its own way).
const POSITIONS = ["Local", "Regional", "OTR", "Jockey"];
const positionOf = (i: Item) => i.carrier.position?.[i.cat] ?? i.cat;

// toggle one carrier; never leaves the pick empty
function toggleIn(cur: string[], id: string): string[] {
  if (cur.includes(id)) return cur.length > 1 ? cur.filter((x) => x !== id) : cur;
  return AGENCY_CARRIERS.map((c) => c.id).filter((x) => x === id || cur.includes(x));
}

// Pay map for the carriers only our agencies work (Barr-Nunn, Day & Ross…):
// pick one or more; each state shows the top weekly pay (colored by the
// carrier paying it when several are picked), click it for the accounts.
export function AgencyCarrierMap({ agencies }: { agencies: Agency[] }) {
  const allIds = AGENCY_CARRIERS.map((c) => c.id);
  const [ids, setIds] = useState<string[]>(allIds);
  const [cat, setCat] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const picked = useMemo(() => AGENCY_CARRIERS.filter((c) => ids.includes(c.id)), [ids]);
  const all = picked.length === AGENCY_CARRIERS.length;
  const single = picked.length === 1 ? picked[0] : null;
  const items = useMemo<Item[]>(() => picked.flatMap((c) => c.fleets.map((f) => ({ ...f, carrier: c }))), [picked]);
  // one carrier: its own categories; several: Local / Regional / OTR / Jockey
  const groupOf = useMemo(() => (single ? (i: Item) => i.cat : positionOf), [single]);
  const groups = single ? single.cats : POSITIONS.filter((p) => items.some((i) => positionOf(i) === p));
  const group = groups.includes(cat) ? cat : "";
  const fleets = useMemo(() => items.filter((i) => !group || groupOf(i) === group), [items, group, groupOf]);

  const pick = (next: string[]) => {
    setIds(next);
    setCat("");
  };

  const pay = useMemo(() => Object.fromEntries(ALL_STATES.map((s) => [s, statePay(fleets, s)])) as Record<string, StatePay | null>, [fleets]);
  // the carrier with the highest weekly pay in each state
  const top = useMemo(() => {
    const out: Record<string, AgencyCarrier | null> = {};
    ALL_STATES.forEach((s) => {
      const list = fleets.filter((f) => f.states.includes(s));
      const best = list.reduce<Item | null>((b, f) => (f.payHigh != null && (b?.payHigh == null || f.payHigh > b.payHigh) ? f : b), null);
      out[s] = (best ?? list[0])?.carrier ?? null;
    });
    return out;
  }, [fleets]);
  const states = ALL_STATES.filter((s) => pay[s]);
  const weekly = states.map((s) => pay[s]!.weekMax).filter((v): v is number => v != null);
  const maxPay = weekly.length ? Math.max(...weekly) : null;
  const topLow = weekly.length ? Math.min(...weekly) : 0;
  const lowest = states.map((s) => pay[s]!.weekMin).filter((v): v is number => v != null);
  const minPay = lowest.length ? Math.min(...lowest) : null;
  const tint = single?.color ?? "#14b8a6";

  const paint = useMemo<MapPaint>(() => {
    const shade = interpolateRgb(LOW_FILL, tint);
    const span = (maxPay ?? 0) - topLow;
    return {
      selected,
      fill: (s) => {
        const p = pay[s];
        if (!p) return NO_DATA_FILL;
        // several carriers: color = the carrier paying the most there (dimmer
        // when no account there lists weekly pay)
        if (!single) {
          const c = top[s]?.color;
          if (!c) return NO_DATA_FILL;
          return p.weekMax == null ? interpolateRgb(LOW_FILL, c)(0.45) : c;
        }
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
        if (!p) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No account hires here for this pick</div>`;
        const byCarrier = picked
          .map((c) => [c, p.fleets.filter((f) => (f as Item).carrier.id === c.id).length] as const)
          .filter(([, n]) => n)
          .map(([c, n]) => `<b style="color:${c.color}">${c.label}</b> ${n}`)
          .join(" · ");
        const t = top[s];
        return (
          `<div style="font-weight:700;margin-bottom:2px">${s}</div>` +
          `<div>${payRange(p)}</div>` +
          (!single && t ? `<div>Top pay: <b style="color:${t.color}">${t.label}</b></div>` : "") +
          `<div style="color:#9aa0ad">${p.fleets.length} account${p.fleets.length === 1 ? "" : "s"} · ${byCarrier}</div>` +
          `<div style="margin-top:3px;color:#7ab8f5">Click for the accounts below the map</div>`
        );
      },
      onClick: (s) => setSelected(pay[s] ? s : null),
    };
  }, [pay, top, picked, selected, tint, single, maxPay, topLow]);

  const sel = selected ? pay[selected] : null;
  const openings = fleets.reduce((n, f) => n + (f.openings ?? 0), 0);
  const winners = picked.filter((c) => states.some((s) => top[s]?.id === c.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-[16px] font-bold text-[var(--cpm-text)] mr-2">Agency carriers map</h2>
        <button
          type="button"
          className={`carrierToggle${all ? " on" : ""}`}
          style={all ? { borderColor: "var(--cpm-accent)", color: "var(--cpm-accent)" } : undefined}
          onClick={() => pick(allIds)}
        >
          All
        </button>
        {AGENCY_CARRIERS.map((c) => {
          const active = ids.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`carrierToggle${active ? " on" : ""}`}
              style={active ? { borderColor: c.color, color: c.color, background: `${c.color}1f` } : undefined}
              // from "All", a click picks just this carrier
              onClick={() => pick(all ? [c.id] : toggleIn(ids, c.id))}
              aria-pressed={active}
            >
              <span className="dot" style={{ background: active ? c.color : "transparent", borderColor: c.color }} />
              {c.label}
            </button>
          );
        })}
        <span className="text-[11.5px] text-[var(--cpm-text-faint)]">Click to pick one; click more to add them. &quot;All&quot; shows every carrier.</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="segTabs">
          {["", ...groups].map((c) => (
            <button key={c || "all"} type="button" className={group === c ? "active" : undefined} onClick={() => setCat(c)}>
              {c || "All"} <span className="opacity-60">{c ? items.filter((i) => groupOf(i) === c).length : items.length}</span>
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
        <button type="button" className="ghostBtn ml-auto" onClick={() => setShowInfo((v) => !v)}>
          {showInfo ? "Hide" : "Show"} carrier info
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cpm-text-dim)]">
        {picked.map((c) => {
          const working = agencies.filter((a) => a.status !== "stopped" && a.carriers.includes(c.id));
          return (
            <span key={c.id}>
              <b style={{ color: c.color }}>{c.label}</b> agencies:{" "}
              {working.length ? working.map((a) => a.name).join(", ") : <span className="text-[var(--cpm-text-faint)]">none yet</span>}
            </span>
          );
        })}
      </div>

      {showInfo &&
        picked.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border bg-[var(--cpm-panel-alt)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--cpm-text-dim)] [&_b]:text-[var(--cpm-text)]"
            style={{ borderColor: `${c.color}66` }}
            dangerouslySetInnerHTML={{ __html: c.note }}
          />
        ))}

      <div className="wizCard">
        <div className="max-w-[960px] mx-auto">
          <ChoroplethMap paint={paint} />
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap mt-2 text-[12px] text-[var(--cpm-text-dim)]">
          {single ? (
            <>
              <span>Number = highest weekly pay in the state (per mile where no weekly pay is given)</span>
              <span className="flex items-center gap-1.5">
                lower
                <span
                  className="w-[90px] h-[9px] rounded inline-block"
                  style={{ background: `linear-gradient(90deg, ${interpolateRgb(LOW_FILL, tint)(0.3)}, ${tint})` }}
                />
                higher
              </span>
            </>
          ) : (
            <>
              <span>Number = highest weekly pay in the state · color = carrier paying it:</span>
              {winners.map((c) => (
                <span key={c.id} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
            </>
          )}
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: NO_DATA_FILL, border: "1px solid #555" }} /> not hiring
          </span>
        </div>
      </div>

      <div className="wizCard min-w-0 !min-h-0">
        {!sel || !selected ? (
          <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-4 text-center">Click a state on the map to see its accounts here.</div>
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
              {(sel.fleets as Item[])
                .slice()
                .sort((a, b) => (b.payHigh ?? 0) - (a.payHigh ?? 0))
                .map((f) => (
                  <FleetCard key={f.id} f={f} state={selected} />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FleetCard({ f, state }: { f: Item; state: string }) {
  return (
    <div
      className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-4 py-3 flex flex-col gap-1.5"
      style={{ borderLeft: `3px solid ${f.carrier.color}` }}
    >
      <div className="text-[11px] font-bold" style={{ color: f.carrier.color }}>
        {f.carrier.label}
      </div>
      <div className="flex items-center gap-2 -mt-1">
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
