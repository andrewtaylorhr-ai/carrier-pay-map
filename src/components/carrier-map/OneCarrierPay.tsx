"use client";

import { useMemo, useState } from "react";
import { interpolateRgb } from "d3-interpolate";
import { ChoroplethMap, type MapPaint } from "./ChoroplethMap";
import { ALL_ACCOUNTS, formatPayShort } from "@/lib/carriers/accounts";
import { ALL_STATES, CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { formatPayRange, statePay, type CarrierStatePay } from "@/lib/carriers/payByState";
import { POSITIONS, positionOf, type Position } from "@/lib/carriers/positions";
import type { Account, CarrierId } from "@/lib/carriers/types";

const NO_DATA_FILL = "#232733";
const LOW_FILL = "#2c3446";
const MIX_COLOR = "#14b8a6"; // several carriers picked
const NO_WEEKLY_FILL = "#3a4a63";
const usd = (n: number | null) => (n == null ? "" : `$${Math.round(n).toLocaleString("en-US")}`);
const lo = (a: number | null, b: number | null) => (b == null ? a : a == null ? b : Math.min(a, b));
const hi = (a: number | null, b: number | null) => (b == null ? a : a == null ? b : Math.max(a, b));

// toggle one item in a multi-select; never leaves it empty
function toggleIn<T>(cur: T[], x: T, order: T[]): T[] {
  if (cur.includes(x)) return cur.length > 1 ? cur.filter((y) => y !== x) : cur;
  return order.filter((y) => y === x || cur.includes(y));
}

// Pay Map "By position": pick one or more carriers and position types
// (Local / Regional / Dedicated / OTR); each state shows the top weekly pay
// among them, click it for the accounts.
export function OneCarrierPay() {
  const [carriers, setCarriers] = useState<CarrierId[]>(CARRIER_ORDER);
  const [positions, setPositions] = useState<Position[]>(POSITIONS);
  const [selected, setSelected] = useState<string | null>(null);

  const allCarriers = carriers.length === CARRIER_ORDER.length;
  const allPositions = positions.length === POSITIONS.length;
  const single = carriers.length === 1 ? CARRIERS[carriers[0]] : null;
  const tint = single?.color ?? MIX_COLOR;

  const picked = (a: Account) => carriers.includes(a.carrier) && positions.includes(positionOf(a.carrier, a.cat));
  const accounts = ALL_ACCOUNTS.filter((a) => a.states.length && picked(a));
  const countFor = (p: Position) =>
    ALL_ACCOUNTS.filter((a) => a.states.length && carriers.includes(a.carrier) && positionOf(a.carrier, a.cat) === p).length;

  // pay per state across the picked carriers' picked categories
  const pay = useMemo(() => {
    const out: Record<string, (CarrierStatePay & { top: CarrierId | null }) | undefined> = {};
    ALL_STATES.forEach((s) => {
      // `top` = the carrier with the highest weekly pay (first in carrier order on a tie)
      let m: (CarrierStatePay & { top: CarrierId | null }) | undefined;
      carriers.forEach((c) =>
        CARRIERS[c].cats
          .filter((cat) => positions.includes(positionOf(c, cat)))
          .forEach((cat) => {
            const p = statePay(s, cat, c)[0];
            if (!p) return;
            const top = p.weekMax != null && (m?.weekMax == null || p.weekMax > m.weekMax) ? c : m?.top ?? null;
            m = m
              ? {
                  ...m,
                  top,
                  accounts: m.accounts + p.accounts,
                  weekMin: lo(m.weekMin, p.weekMin),
                  weekMax: hi(m.weekMax, p.weekMax),
                  cpmMin: lo(m.cpmMin, p.cpmMin),
                  cpmMax: hi(m.cpmMax, p.cpmMax),
                }
              : { ...p, top };
          })
      );
      out[s] = m;
    });
    return out;
  }, [carriers, positions]);

  const states = ALL_STATES.filter((s) => pay[s]);
  const weekly = states.map((s) => pay[s]!.weekMax).filter((v): v is number => v != null);
  const lowest = states.map((s) => pay[s]!.weekMin).filter((v): v is number => v != null);
  const minPay = lowest.length ? Math.min(...lowest) : null;
  const maxPay = weekly.length ? Math.max(...weekly) : null;
  const topLow = weekly.length ? Math.min(...weekly) : 0;
  const winners = CARRIER_ORDER.filter((id) => states.some((s) => pay[s]!.top === id));

  const accountsIn = (s: string) => accounts.filter((a) => a.states.includes(s));
  const positionMix = (list: Account[]) =>
    POSITIONS.map((p) => [p, list.filter((a) => positionOf(a.carrier, a.cat) === p).length] as const).filter(([, n]) => n);

  const paint = useMemo<MapPaint>(() => {
    const shade = interpolateRgb(LOW_FILL, tint);
    const span = (maxPay ?? 0) - topLow;
    return {
      selected,
      fill: (s) => {
        const p = pay[s];
        if (!p) return NO_DATA_FILL;
        // several carriers: color = the carrier paying the most there
        if (!single) return p.top ? CARRIERS[p.top].color : NO_WEEKLY_FILL;
        if (p.weekMax == null || !span) return shade(0.75);
        return shade(0.3 + (0.7 * (p.weekMax - topLow)) / span);
      },
      label: (s) => {
        const p = pay[s];
        if (!p) return null;
        if (p.weekMax != null) return usd(p.weekMax);
        if (p.cpmMax != null) return `$${p.cpmMax.toFixed(2)}/mi`;
        return null; // hiring, but no pay listed
      },
      tooltip: (s) => {
        const p = pay[s];
        if (!p) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No open offers for this pick</div>`;
        const mix = positionMix(accountsIn(s))
          .map(([pos, n]) => `${pos} ${n}`)
          .join(" · ");
        return (
          `<div style="font-weight:700;margin-bottom:2px">${s}</div>` +
          `<div>${formatPayRange(p)}</div>` +
          (p.top && !single ? `<div>Top pay: <b style="color:${CARRIERS[p.top].color}">${CARRIERS[p.top].label}</b></div>` : "") +
          `<div style="color:#9aa0ad">${p.accounts} open offer${p.accounts === 1 ? "" : "s"} · ${mix}</div>` +
          `<div style="margin-top:3px;color:#7ab8f5">Click for the list below the map</div>`
        );
      },
      onClick: (s) => setSelected(pay[s] ? s : null),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay, selected, tint, single, maxPay, topLow]);

  const selAccounts = selected ? accountsIn(selected) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--cpm-text-faint)] mr-1">Carriers</span>
        <button
          type="button"
          className={`carrierToggle${allCarriers ? " on" : ""}`}
          style={allCarriers ? { borderColor: "var(--cpm-accent)", color: "var(--cpm-accent)" } : undefined}
          onClick={() => setCarriers(CARRIER_ORDER)}
        >
          All
        </button>
        {CARRIER_ORDER.map((id) => {
          const k = CARRIERS[id];
          const active = carriers.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={`carrierToggle${active ? " on" : ""}`}
              style={active ? { borderColor: k.color, color: k.color, background: `${k.color}1f` } : undefined}
              // from "All", a click picks just this carrier
              onClick={() => setCarriers(allCarriers ? [id] : toggleIn(carriers, id, CARRIER_ORDER))}
              aria-pressed={active}
            >
              <span className="dot" style={{ background: active ? k.color : "transparent", borderColor: k.color }} />
              {k.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--cpm-text-faint)]">Positions</span>
        <div className="segTabs">
          <button type="button" className={allPositions ? "active" : undefined} onClick={() => setPositions(POSITIONS)}>
            All
          </button>
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              className={!allPositions && positions.includes(p) ? "active" : undefined}
              onClick={() => setPositions(allPositions ? [p] : toggleIn(positions, p, POSITIONS))}
            >
              {p} <span className="opacity-60">{countFor(p)}</span>
            </button>
          ))}
        </div>
        <div className="offerTotal">
          <b>{accounts.length}</b> open offer{accounts.length === 1 ? "" : "s"} · <b>{states.length}</b> states
          {maxPay != null && (
            <>
              {" "}· pay <b>{usd(minPay)}</b> – <b>{usd(maxPay)}</b>/wk
            </>
          )}
        </div>
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] -mt-2">
        Click to pick one; click more to add them. &quot;All&quot; brings everything back.
      </div>

      <div className="flex flex-col gap-5">
        <div className="wizCard">
          <div className="max-w-[960px] mx-auto">
            <ChoroplethMap paint={paint} />
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap mt-2 text-[12px] text-[var(--cpm-text-dim)]">
            {single ? (
              <>
                <span>Number = highest pay in the state (per week, or per mile)</span>
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
                {winners.map((id) => (
                  <span key={id} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: CARRIERS[id].color }} />
                    {CARRIERS[id].label}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: NO_WEEKLY_FILL }} /> per-mile pay only
                </span>
              </>
            )}
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: NO_DATA_FILL, border: "1px solid #555" }} /> not hiring
            </span>
          </div>
        </div>

        <div className="wizCard min-w-0 !min-h-0">
          {!selected ? (
            <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-4 text-center">Click a state on the map to see its offers here.</div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="text-[17px] font-bold text-[var(--cpm-text)]">{selected}</div>
                <div className="text-[12px] text-[var(--cpm-text-faint)]">
                  {selAccounts.length} offer{selAccounts.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {positionMix(selAccounts).map(([p, n]) => (
                  <span key={p} className="catTag">
                    {p} {n}
                  </span>
                ))}
              </div>
              <div>
                <table className="payTable">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Pay</th>
                      <th>Home time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selAccounts
                      .slice()
                      .sort((a, b) => (b.payHigh ?? b.payLow ?? 0) - (a.payHigh ?? a.payLow ?? 0))
                      .map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="font-semibold">
                              {a.name}
                              {a.approval === "Yes" && <span className="ml-1 text-[10.5px] text-[#f5c451]">needs approval</span>}
                            </div>
                            <div className="text-[11px]">
                              <b style={{ color: CARRIERS[a.carrier].color }}>{CARRIERS[a.carrier].label}</b>
                              <span className="text-[var(--cpm-text-faint)]">
                                {" "}
                                · {positionOf(a.carrier, a.cat)}
                                {a.cat !== positionOf(a.carrier, a.cat) ? ` (${a.cat})` : ""}
                              </span>
                            </div>
                          </td>
                          <td>{formatPayShort(a)}</td>
                          <td className="text-[var(--cpm-text-dim)]">{a.hometime || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
