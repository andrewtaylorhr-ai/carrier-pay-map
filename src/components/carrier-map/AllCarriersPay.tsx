"use client";

import { Fragment, useMemo, useState } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateBlues, interpolateGreens } from "d3-scale-chromatic";
import { Briefcase, ChevronDown, ChevronRight, DollarSign, Hash, Search } from "lucide-react";
import { ChoroplethMap, type MapPaint } from "./ChoroplethMap";
import { ALL_ACCOUNTS, carrierAccounts, formatPayShort } from "@/lib/carriers/accounts";
import { ALL_STATES, CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { formatCpmRange, formatPayRange, statePay, type CarrierStatePay } from "@/lib/carriers/payByState";
import { INDEED_PAY_AS_OF, INDEED_WEEKLY_PAY, indeedSourceUrl } from "@/lib/carriers/indeedPay";
import type { CarrierId } from "@/lib/carriers/types";

const NO_DATA_FILL = "#232733";
const NO_WEEKLY_FILL = "#3a4a63";
const usd = (n: number | null) => (n == null ? "" : `$${Math.round(n).toLocaleString("en-US")}`);
// Indeed's average weekly truck driver pay in the state (see indeedPay.ts)
const indeedOf = (s: string): number | undefined => INDEED_WEEKLY_PAY[STATE_CODE[s]];
const diffText = (d: number) => `${d >= 0 ? "+" : "−"}${usd(Math.abs(d))}`;
const diffColor = (d: number) => (d >= 0 ? "#4ade80" : "#f87171");

// Pay Map "All carriers": every carrier's lowest and highest pay in each
// state, on the map (hover / click) and in one table of all states.
export function AllCarriersPay() {
  const [on, setOn] = useState<Set<CarrierId>>(() => new Set(CARRIER_ORDER));
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [metric, setMetric] = useState<"pay" | "offers" | "indeed">("pay");
  const [open, setOpen] = useState<Set<CarrierId>>(() => new Set()); // carriers whose accounts are shown
  const toggleOpen = (id: CarrierId) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
  // open offers (accounts) hiring in each state; one account can hire in several states
  const offersIn = (s: string) => (byState[s] || []).reduce((n, p) => n + p.accounts, 0);
  const maxOffers = Math.max(1, ...ALL_STATES.map(offersIn));
  const totalOffers = ALL_ACCOUNTS.filter((a) => on.has(a.carrier) && a.states.length).length;
  const statesWithOffers = ALL_STATES.filter((s) => offersIn(s) > 0).length;
  const winners = CARRIER_ORDER.filter((id) => ALL_STATES.some((s) => best[s]?.carrier === id));

  const paint = useMemo<MapPaint>(() => {
    const bestCpm = (s: string) => Math.max(...byState[s].map((p) => p.cpmMax ?? 0));
    const green = scaleSequential(interpolateGreens).domain([-maxOffers * 0.15, maxOffers]);
    // clamped so one high state (Vermont) doesn't wash out the rest
    const blue = scaleSequential(interpolateBlues).domain([1350, 2100]).clamp(true);
    return {
      selected,
      fill: (s) => {
        if (metric === "indeed") return indeedOf(s) != null ? blue(indeedOf(s)!) : NO_DATA_FILL;
        if (!byState[s]?.length) return NO_DATA_FILL;
        if (metric === "offers") return green(offersIn(s));
        const b = best[s];
        return b ? CARRIERS[b.carrier].color : NO_WEEKLY_FILL;
      },
      label: (s) => {
        if (metric === "indeed") return indeedOf(s) != null ? usd(indeedOf(s)!) : null;
        if (!byState[s]?.length) return null;
        if (metric === "offers") return String(offersIn(s));
        const b = best[s];
        if (b?.weekMax != null) return usd(b.weekMax);
        const c = bestCpm(s);
        return c ? `$${c.toFixed(2)}/mi` : null;
      },
      tooltip: (s) => {
        const list = byState[s] || [];
        if (!list.length) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No open accounts</div>`;
        return (
          `<div style="font-weight:700;margin-bottom:4px">${s} — ${offersIn(s)} open offer${offersIn(s) === 1 ? "" : "s"}</div>` +
          (indeedOf(s) != null ? `<div style="color:#7ab8f5;margin-bottom:2px">Indeed average — ${usd(indeedOf(s)!)}/wk</div>` : "") +
          list
            .map(
              (p) =>
                `<div><b style="color:${CARRIERS[p.carrier].color}">${CARRIERS[p.carrier].label}</b> — ${formatPayRange(p)} <span style="color:#9aa0ad">(${p.accounts})</span></div>`
            )
            .join("") +
          `<div style="margin-top:4px;color:#7ab8f5">Click for the table</div>`
        );
      },
      onClick: (s) => {
        setSelected(s);
        setOpen(new Set());
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byState, best, selected, metric, maxOffers]);

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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="segTabs">
          <button type="button" className={metric === "pay" ? "active" : undefined} onClick={() => setMetric("pay")}>
            <DollarSign size={14} /> Top pay
          </button>
          <button type="button" className={metric === "offers" ? "active" : undefined} onClick={() => setMetric("offers")}>
            <Hash size={14} /> Number of offers
          </button>
          <button type="button" className={metric === "indeed" ? "active" : undefined} onClick={() => setMetric("indeed")}>
            <Briefcase size={14} /> Indeed pay
          </button>
        </div>
        <div className="offerTotal">
          <b>{totalOffers.toLocaleString("en-US")}</b> open offers · <b>{statesWithOffers}</b> states
        </div>
      </div>

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
            {metric === "indeed" ? (
              <>
                <span>Number = Indeed average weekly truck driver pay (from Indeed job postings, {INDEED_PAY_AS_OF})</span>
                <span className="flex items-center gap-1.5">
                  lower <span className="payRamp" /> higher
                </span>
              </>
            ) : metric === "offers" ? (
              <>
                <span>Number = open offers hiring in the state · darker = more</span>
                <span className="offerRamp" />
                <span>1 – {maxOffers}</span>
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
          </div>
        </div>

        <div className="wizCard flex-1 min-w-0">
          {!selected ? (
            <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-6 text-center">
              Hover a state to see every carrier&apos;s pay there. Click it to pin the details here.
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="text-[17px] font-bold text-[var(--cpm-text)]">{selected}</div>
                <div className="text-[12px] text-[var(--cpm-text-faint)]">
                  {sel.length} carrier{sel.length === 1 ? "" : "s"} · {sel.reduce((n, p) => n + p.accounts, 0)} open accounts
                  {sel.length > 0 && (
                    <button
                      type="button"
                      className="ml-2 text-[#7ab8f5] hover:underline"
                      onClick={() => setOpen(open.size === sel.length ? new Set() : new Set(sel.map((p) => p.carrier)))}
                    >
                      {open.size === sel.length ? "Hide all" : "Show all"}
                    </button>
                  )}
                </div>
              </div>
              {indeedOf(selected) != null && (
                <div className="text-[13px] mb-3 text-[var(--cpm-text-dim)]">
                  Indeed average: <b className="text-[var(--cpm-text)]">{usd(indeedOf(selected)!)}/wk</b>{" "}
                  <a href={indeedSourceUrl(STATE_CODE[selected])} target="_blank" rel="noreferrer" className="text-[#7ab8f5] hover:underline">
                    Indeed ↗
                  </a>
                </div>
              )}
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
                      .map((p) => {
                        const isOpen = open.has(p.carrier);
                        return (
                          <Fragment key={p.carrier}>
                            <tr className="cursor-pointer hover:bg-[var(--cpm-panel-alt)]" onClick={() => toggleOpen(p.carrier)}>
                              <td>
                                <span className="inline-flex items-center gap-1">
                                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                  <b style={{ color: CARRIERS[p.carrier].color }}>{CARRIERS[p.carrier].label}</b>
                                </span>
                              </td>
                              <td>{p.weekMin != null ? `${usd(p.weekMin)}/wk` : "—"}</td>
                              <td className="font-bold">
                                {p.weekMax != null ? `${usd(p.weekMax)}/wk` : "—"}
                                {p.weekMax != null && indeedOf(selected) != null && (
                                  <div className="text-[10.5px] font-semibold" style={{ color: diffColor(p.weekMax - indeedOf(selected)!) }}>
                                    {diffText(p.weekMax - indeedOf(selected)!)} vs Indeed
                                  </div>
                                )}
                              </td>
                              <td>{formatCpmRange(p) || "—"}</td>
                              <td>
                                <button type="button" className="text-[#7ab8f5] hover:underline whitespace-nowrap">
                                  {p.accounts} · {isOpen ? "Hide" : "Show"}
                                </button>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr>
                                <td colSpan={5} className="!p-0">
                                  <div className="max-h-[260px] overflow-y-auto bg-[var(--cpm-panel-alt)] px-3 py-1">
                                    {carrierAccounts(p.carrier, undefined, selected!)
                                      .slice()
                                      .sort((a, b) => (b.payHigh ?? b.payLow ?? 0) - (a.payHigh ?? a.payLow ?? 0))
                                      .map((a) => (
                                        <div key={a.id} className="flex gap-3 py-1.5 border-b border-[var(--cpm-border)] last:border-0 text-[12.5px]">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold">
                                              {a.name}
                                              {a.approval === "Yes" && <span className="ml-1 text-[10.5px] text-[#f5c451]">needs approval</span>}
                                            </div>
                                            <div className="text-[11px] text-[var(--cpm-text-faint)]">
                                              {[a.cat, a.hometime].filter(Boolean).join(" · ")}
                                            </div>
                                          </div>
                                          <div className="text-right max-w-[45%] shrink-0 text-[var(--cpm-text-dim)]">{formatPayShort(a)}</div>
                                        </div>
                                      ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
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
                <th>Offers</th>
                <th>Indeed avg</th>
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
                    <td className="font-bold">{offersIn(s)}</td>
                    <td className="text-[#7ab8f5] font-semibold">{indeedOf(s) != null ? usd(indeedOf(s)!) : "—"}</td>
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
