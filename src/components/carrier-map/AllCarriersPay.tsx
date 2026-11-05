"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ChoroplethMap, type MapPaint } from "./ChoroplethMap";
import { ALL_STATES, CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { formatCpmRange, formatPayRange, statePay, type CarrierStatePay } from "@/lib/carriers/payByState";
import type { CarrierId } from "@/lib/carriers/types";

const NO_DATA_FILL = "#232733";
const NO_WEEKLY_FILL = "#3a4a63";
const usd = (n: number | null) => (n == null ? "" : `$${Math.round(n).toLocaleString("en-US")}`);

// Pay Map "All carriers": every carrier's lowest and highest pay in each
// state, on the map (hover / click) and in one table of all states.
export function AllCarriersPay() {
  const [on, setOn] = useState<Set<CarrierId>>(() => new Set(CARRIER_ORDER));
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const byState = useMemo(() => {
    const out: Record<string, CarrierStatePay[]> = {};
    ALL_STATES.forEach((s) => (out[s] = statePay(s).filter((p) => on.has(p.carrier))));
    return out;
  }, [on]);
  // the carrier paying the most per week in each state (first in carrier order on a tie)
  const best = useMemo(() => {
    const out: Record<string, CarrierStatePay | null> = {};
    ALL_STATES.forEach((s) => {
      out[s] = byState[s].reduce<CarrierStatePay | null>(
        (b, p) => (p.weekMax != null && (b?.weekMax == null || p.weekMax > b.weekMax) ? p : b),
        null
      );
    });
    return out;
  }, [byState]);
  const winners = CARRIER_ORDER.filter((id) => ALL_STATES.some((s) => best[s]?.carrier === id));

  const paint = useMemo<MapPaint>(() => {
    const bestCpm = (s: string) => Math.max(...byState[s].map((p) => p.cpmMax ?? 0));
    return {
      selected,
      fill: (s) => {
        if (!byState[s]?.length) return NO_DATA_FILL;
        const b = best[s];
        return b ? CARRIERS[b.carrier].color : NO_WEEKLY_FILL;
      },
      label: (s) => {
        if (!byState[s]?.length) return null;
        const b = best[s];
        if (b?.weekMax != null) return usd(b.weekMax);
        const c = bestCpm(s);
        return c ? `$${c.toFixed(2)}/mi` : null;
      },
      tooltip: (s) => {
        const list = byState[s] || [];
        if (!list.length) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No open accounts</div>`;
        return (
          `<div style="font-weight:700;margin-bottom:4px">${s}</div>` +
          list
            .map(
              (p) =>
                `<div><b style="color:${CARRIERS[p.carrier].color}">${CARRIERS[p.carrier].label}</b> — ${formatPayRange(p)} <span style="color:#9aa0ad">(${p.accounts})</span></div>`
            )
            .join("") +
          `<div style="margin-top:4px;color:#7ab8f5">Click for the table</div>`
        );
      },
      onClick: (s) => setSelected(s),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byState, best, selected]);

  const toggle = (id: CarrierId) =>
    setOn((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const q = query.trim().toLowerCase();
  const tableStates = ALL_STATES.filter((s) => byState[s]?.length).filter(
    (s) => !q || s.toLowerCase().includes(q) || STATE_CODE[s]?.toLowerCase() === q
  );
  const carriersShown = CARRIER_ORDER.filter((id) => on.has(id));
  const sel = selected ? byState[selected] || [] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--cpm-text-faint)] mr-1">Carriers</span>
        {CARRIER_ORDER.map((id) => {
          const c = CARRIERS[id];
          const active = on.has(id);
          return (
            <button
              key={id}
              type="button"
              className={`carrierToggle${active ? " on" : ""}`}
              style={active ? { borderColor: c.color, color: c.color } : undefined}
              onClick={() => toggle(id)}
              aria-pressed={active}
            >
              <span className="dot" style={{ background: active ? c.color : "transparent", borderColor: c.color }} />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="wizCard xl:w-[62%] shrink-0">
          <ChoroplethMap paint={paint} />
          <div className="flex items-center gap-3 flex-wrap mt-2 text-[12px] text-[var(--cpm-text-dim)]">
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
          </div>
        </div>

        <div className="wizCard flex-1 min-w-0">
          {!selected ? (
            <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-6 text-center">
              Hover a state to see every carrier&apos;s pay there. Click it to pin the details here.
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <div className="text-[17px] font-bold text-[var(--cpm-text)]">{selected}</div>
                <div className="text-[12px] text-[var(--cpm-text-faint)]">
                  {sel.length} carrier{sel.length === 1 ? "" : "s"} · {sel.reduce((n, p) => n + p.accounts, 0)} open accounts
                </div>
              </div>
              {!sel.length ? (
                <div className="text-[13px] text-[var(--cpm-text-dim)]">No open accounts here for the carriers picked.</div>
              ) : (
                <table className="payTable">
                  <thead>
                    <tr>
                      <th>Carrier</th>
                      <th>Min pay</th>
                      <th>Max pay</th>
                      <th>Per mile</th>
                      <th>Accounts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sel
                      .slice()
                      .sort((a, b) => (b.weekMax ?? 0) - (a.weekMax ?? 0))
                      .map((p) => (
                        <tr key={p.carrier}>
                          <td>
                            <b style={{ color: CARRIERS[p.carrier].color }}>{CARRIERS[p.carrier].label}</b>
                          </td>
                          <td>{p.weekMin != null ? `${usd(p.weekMin)}/wk` : "—"}</td>
                          <td className="font-bold">{p.weekMax != null ? `${usd(p.weekMax)}/wk` : "—"}</td>
                          <td>{formatCpmRange(p) || "—"}</td>
                          <td>{p.accounts}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      <div className="wizCard">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <div className="text-[15px] font-bold text-[var(--cpm-text)]">Pay by state — all carriers</div>
            <div className="text-[12px] text-[var(--cpm-text-faint)]">Lowest – highest weekly pay across each carrier&apos;s open accounts in the state.</div>
          </div>
          <div className="wizInput w-[220px]">
            <Search size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a state (CA, Texas…)" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="payTable wide">
            <thead>
              <tr>
                <th>State</th>
                {carriersShown.map((id) => (
                  <th key={id} style={{ color: CARRIERS[id].color }}>
                    {CARRIERS[id].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableStates.map((s) => {
                const list = byState[s];
                return (
                  <tr key={s} className={s === selected ? "sel" : undefined} onClick={() => setSelected(s)}>
                    <td className="font-semibold">
                      {STATE_CODE[s]} <span className="text-[var(--cpm-text-faint)] font-normal">{s}</span>
                    </td>
                    {carriersShown.map((id) => {
                      const p = list.find((x) => x.carrier === id);
                      if (!p) return <td key={id} className="empty">—</td>;
                      const week =
                        p.weekMin == null ? "" : p.weekMin === p.weekMax ? usd(p.weekMin) : `${usd(p.weekMin)} – ${usd(p.weekMax)}`;
                      return (
                        <td key={id}>
                          {week && <div className="font-semibold">{week}</div>}
                          {formatCpmRange(p) && <div className="text-[11px] text-[var(--cpm-text-dim)]">{formatCpmRange(p)}</div>}
                          {!week && !formatCpmRange(p) && <div className="text-[11px] text-[var(--cpm-text-faint)]">no pay listed</div>}
                          <div className="text-[10.5px] text-[var(--cpm-text-faint)]">
                            {p.accounts} account{p.accounts === 1 ? "" : "s"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
