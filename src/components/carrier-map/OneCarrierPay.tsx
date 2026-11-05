"use client";

import { useMemo, useState } from "react";
import { interpolateRgb } from "d3-interpolate";
import { ChoroplethMap, type MapPaint } from "./ChoroplethMap";
import { carrierAccounts, formatPayShort } from "@/lib/carriers/accounts";
import { ALL_STATES, CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { formatPayRange, statePay, type CarrierStatePay } from "@/lib/carriers/payByState";
import { useCarrierMap } from "@/lib/carrier-map-context";

const NO_DATA_FILL = "#232733";
const LOW_FILL = "#2c3446";
const usd = (n: number | null) => (n == null ? "" : `$${Math.round(n).toLocaleString("en-US")}`);

// Pay Map "One carrier": pick a carrier and a category; each state shows that
// carrier's top weekly pay there (brighter = higher), click it for the accounts.
export function OneCarrierPay() {
  const { currentCarrier: carrier, setCarrier, currentCat: cat, setCat } = useCarrierMap();
  const [selected, setSelected] = useState<string | null>(null);
  const c = CARRIERS[carrier];

  const pay = useMemo(() => {
    const out: Record<string, CarrierStatePay | undefined> = {};
    ALL_STATES.forEach((s) => (out[s] = statePay(s, cat, carrier)[0]));
    return out;
  }, [carrier, cat]);

  const accounts = carrierAccounts(carrier, cat).filter((a) => a.states.length);
  const states = ALL_STATES.filter((s) => pay[s]);
  const weekly = states.map((s) => pay[s]!.weekMax).filter((v): v is number => v != null);
  const lowest = states.map((s) => pay[s]!.weekMin).filter((v): v is number => v != null);
  const minPay = lowest.length ? Math.min(...lowest) : null;
  const maxPay = weekly.length ? Math.max(...weekly) : null;
  const topLow = weekly.length ? Math.min(...weekly) : 0;

  const paint = useMemo<MapPaint>(() => {
    const shade = interpolateRgb(LOW_FILL, c.color);
    const span = (maxPay ?? 0) - topLow;
    return {
      selected,
      fill: (s) => {
        const p = pay[s];
        if (!p) return NO_DATA_FILL;
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
        if (!p) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">${c.label} ${cat}: not hiring here</div>`;
        return (
          `<div style="font-weight:700;margin-bottom:2px">${s}</div>` +
          `<div>${formatPayRange(p)}</div>` +
          `<div style="color:#9aa0ad">${p.accounts} open offer${p.accounts === 1 ? "" : "s"} · click for the list</div>`
        );
      },
      onClick: (s) => setSelected(pay[s] ? s : null),
    };
  }, [pay, selected, c, cat, maxPay, topLow]);

  const pickCarrier = (id: typeof carrier) => {
    setCarrier(id);
    setSelected(null);
  };
  const pickCat = (k: string) => {
    setCat(k);
    setSelected(null);
  };
  const selAccounts = selected ? carrierAccounts(carrier, cat, selected) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {CARRIER_ORDER.map((id) => {
          const k = CARRIERS[id];
          const active = id === carrier;
          return (
            <button
              key={id}
              type="button"
              className={`carrierToggle${active ? " on" : ""}`}
              style={active ? { borderColor: k.color, color: k.color, background: `${k.color}1f` } : undefined}
              onClick={() => pickCarrier(id)}
              aria-pressed={active}
            >
              <span className="dot" style={{ background: active ? k.color : "transparent", borderColor: k.color }} />
              {k.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="segTabs">
          {c.cats.map((k) => (
            <button key={k} type="button" className={k === cat ? "active" : undefined} onClick={() => pickCat(k)}>
              {k} <span className="opacity-60">{carrierAccounts(carrier, k).filter((a) => a.states.length).length}</span>
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

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="wizCard xl:w-[62%] shrink-0">
          <ChoroplethMap paint={paint} />
          <div className="flex items-center gap-3 flex-wrap mt-2 text-[12px] text-[var(--cpm-text-dim)]">
            <span>Number = highest pay in the state (per week, or per mile)</span>
            <span className="flex items-center gap-1.5">
              lower
              <span className="w-[90px] h-[9px] rounded inline-block" style={{ background: `linear-gradient(90deg, ${interpolateRgb(LOW_FILL, c.color)(0.3)}, ${c.color})` }} />
              higher
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: NO_DATA_FILL, border: "1px solid #555" }} /> not hiring
            </span>
          </div>
        </div>

        <div className="wizCard flex-1 min-w-0">
          {!selected ? (
            <div className="text-[13.5px] text-[var(--cpm-text-dim)] py-6 text-center">
              Click a state to see {c.label}&apos;s {cat} offers there.
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <div className="text-[17px] font-bold text-[var(--cpm-text)]">
                  {selected} <span style={{ color: c.color }}>· {c.label} {cat}</span>
                </div>
                <div className="text-[12px] text-[var(--cpm-text-faint)]">
                  {selAccounts.length} offer{selAccounts.length === 1 ? "" : "s"}
                </div>
              </div>
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
                        <td className="font-semibold">
                          {a.name}
                          {a.approval === "Yes" && <span className="ml-1 text-[10.5px] text-[#f5c451]">needs approval</span>}
                        </td>
                        <td>{formatPayShort(a)}</td>
                        <td className="text-[var(--cpm-text-dim)]">{a.hometime || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
