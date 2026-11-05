"use client";

import { useMemo, useState } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { ChoroplethMap, type MapPaint } from "./ChoroplethMap";
import { ALL_STATES, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { INDEED_PAY_AS_OF, INDEED_WEEKLY_PAY, indeedSourceUrl } from "@/lib/carriers/indeedPay";
import { statePay } from "@/lib/carriers/payByState";
import type { CarrierId } from "@/lib/carriers/types";

const NO_DATA_FILL = "#232733";
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const diffText = (d: number) => `${d >= 0 ? "+" : "−"}${usd(Math.abs(d))}`;
const diffColor = (d: number) => (d >= 0 ? "#4ade80" : "#f87171");

const indeedOf = (s: string) => INDEED_WEEKLY_PAY[STATE_CODE[s]];

// Pay Map "Indeed pay": Indeed's average weekly truck driver pay per state,
// next to our best carrier offer there.
export function IndeedPay() {
  const [selected, setSelected] = useState<string | null>(null);

  // our highest weekly offer per state, across all carriers
  const best = useMemo(() => {
    const out: Record<string, { pay: number; carrier: CarrierId } | null> = {};
    ALL_STATES.forEach((s) => {
      const top = statePay(s).reduce<{ pay: number; carrier: CarrierId } | null>(
        (b, p) => (p.weekMax != null && (!b || p.weekMax > b.pay) ? { pay: p.weekMax, carrier: p.carrier } : b),
        null
      );
      out[s] = top;
    });
    return out;
  }, []);

  const states = ALL_STATES.filter((s) => indeedOf(s) != null);
  const vals = states.map(indeedOf);
  const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);

  const paint = useMemo<MapPaint>(() => {
    // clamp so one high state (Vermont) doesn't wash out the rest
    const color = scaleSequential(interpolateBlues).domain([1350, 2100]).clamp(true);
    return {
      selected,
      fill: (s) => (indeedOf(s) != null ? color(indeedOf(s)) : NO_DATA_FILL),
      label: (s) => (indeedOf(s) != null ? usd(indeedOf(s)) : null),
      tooltip: (s) => {
        const v = indeedOf(s);
        if (v == null) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No Indeed data</div>`;
        const b = best[s];
        return (
          `<div style="font-weight:700;margin-bottom:2px">${s}</div>` +
          `<div>Indeed average: <b>${usd(v)}/wk</b></div>` +
          (b
            ? `<div>Our best offer: <b>${usd(b.pay)}/wk</b> <span style="color:${diffColor(b.pay - v)}">(${diffText(b.pay - v)})</span></div>`
            : `<div style="color:#9aa0ad">No weekly offer of ours here</div>`)
        );
      },
      onClick: (s) => setSelected(indeedOf(s) != null ? s : null),
    };
  }, [selected, best]);

  const sel = selected ? statePay(selected).filter((p) => p.weekMax != null).sort((a, b) => b.weekMax! - a.weekMax!) : [];
  const selIndeed = selected ? indeedOf(selected) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="offerTotal">
        Indeed average truck driver pay · <b>{states.length}</b> states · US average <b>{usd(avg)}</b>/wk · from Indeed job postings, {INDEED_PAY_AS_OF}
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="wizCard xl:w-[62%] shrink-0">
          <ChoroplethMap paint={paint} />
          <div className="flex items-center gap-3 flex-wrap mt-2 text-[12px] text-[var(--cpm-text-dim)]">
            <span>Number = Indeed average weekly pay</span>
            <span className="flex items-center gap-1.5">
              lower <span className="payRamp" /> higher
            </span>
          </div>
        </div>

        <div className="wizCard flex-1 min-w-0">
          {!selected ? (
            <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-6 text-center">
              Click a state to compare Indeed&apos;s average with our carriers&apos; pay there.
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="text-[17px] font-bold text-[var(--cpm-text)]">{selected}</div>
                <a
                  href={indeedSourceUrl(STATE_CODE[selected])}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] text-[#7ab8f5] hover:underline"
                >
                  Indeed page ↗
                </a>
              </div>
              <div className="text-[13.5px] mb-3">
                Indeed average: <b className="text-[18px]">{usd(selIndeed)}</b>/wk
              </div>
              {!sel.length ? (
                <div className="text-[13px] text-[var(--cpm-text-dim)]">No weekly pay offers of ours in this state.</div>
              ) : (
                <table className="payTable">
                  <thead>
                    <tr>
                      <th>Carrier</th>
                      <th>Our max pay</th>
                      <th>vs Indeed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sel.map((p) => (
                      <tr key={p.carrier}>
                        <td>
                          <b style={{ color: CARRIERS[p.carrier].color }}>{CARRIERS[p.carrier].label}</b>
                        </td>
                        <td className="font-bold">{usd(p.weekMax!)}/wk</td>
                        <td className="font-bold" style={{ color: diffColor(p.weekMax! - selIndeed) }}>
                          {diffText(p.weekMax! - selIndeed)}
                        </td>
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
        <div className="text-[15px] font-bold text-[var(--cpm-text)]">Indeed pay vs our best offer</div>
        <div className="text-[12px] text-[var(--cpm-text-faint)] mb-3">Highest Indeed average first. Green = our best offer pays more than the Indeed average.</div>
        <div className="overflow-x-auto">
          <table className="payTable wide">
            <thead>
              <tr>
                <th>State</th>
                <th>Indeed avg</th>
                <th>Our best offer</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {states
                .slice()
                .sort((a, b) => indeedOf(b) - indeedOf(a))
                .map((s) => {
                  const b = best[s];
                  return (
                    <tr key={s} className={s === selected ? "sel" : undefined} onClick={() => setSelected(s)}>
                      <td className="font-semibold">
                        {STATE_CODE[s]} <span className="text-[var(--cpm-text-faint)] font-normal">{s}</span>
                      </td>
                      <td className="font-bold">{usd(indeedOf(s))}/wk</td>
                      <td>
                        {b ? (
                          <>
                            {usd(b.pay)}/wk{" "}
                            <span className="text-[11px]" style={{ color: CARRIERS[b.carrier].color }}>
                              {CARRIERS[b.carrier].label}
                            </span>
                          </>
                        ) : (
                          <span className="text-[var(--cpm-text-faint)]">—</span>
                        )}
                      </td>
                      <td className="font-bold" style={b ? { color: diffColor(b.pay - indeedOf(s)) } : undefined}>
                        {b ? diffText(b.pay - indeedOf(s)) : ""}
                      </td>
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
