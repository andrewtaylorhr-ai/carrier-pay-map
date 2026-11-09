// Every carrier's pay range per state, across all of its open accounts there
// (Pay Map "All carriers" view). Weekly pay comes from each account's
// payLow / payHigh; per-mile pay (PAM's year-3 CPM, USX OTR Solo's region
// CPM table) is kept apart since it can't be compared to a weekly number.
import { carrierAccounts } from "./accounts";
import { CARRIER_ORDER, USX_OTR_SOLO_REGIONS, USX_STATE_REGION } from "./data";
import type { CarrierId } from "./types";

export interface CarrierStatePay {
  carrier: CarrierId;
  accounts: number;
  weekMin: number | null;
  weekMax: number | null;
  cpmMin: number | null;
  cpmMax: number | null;
}

const lo = (a: number | null, b: number) => (a == null ? b : Math.min(a, b));
const hi = (a: number | null, b: number) => (a == null ? b : Math.max(a, b));

export function statePay(state: string, cat?: string, only?: CarrierId): CarrierStatePay[] {
  return CARRIER_ORDER.filter((c) => !only || c === only).map((carrier): CarrierStatePay => {
    const list = carrierAccounts(carrier, cat, state);
    const p: CarrierStatePay = { carrier, accounts: list.length, weekMin: null, weekMax: null, cpmMin: null, cpmMax: null };
    list.forEach((a) => {
      if (a.payLow != null) {
        p.weekMin = lo(p.weekMin, a.payLow);
        p.weekMax = hi(p.weekMax, a.payHigh ?? a.payLow);
      }
      // "$0.55 CPM" or a range, "$0.67–$0.71 CPM"
      const cpm = /\$(\d*\.\d+)(?:\s*[–-]\s*\$(\d*\.\d+))? CPM/.exec(a.payText);
      if (cpm) {
        p.cpmMin = lo(p.cpmMin, Number(cpm[1]));
        p.cpmMax = hi(p.cpmMax, Number(cpm[2] ?? cpm[1]));
      }
      if (carrier === "usx" && a.cat === "OTR Solo Company") {
        const region = USX_STATE_REGION[state];
        const cpm = region ? USX_OTR_SOLO_REGIONS[region]?.cpm : null;
        if (cpm?.length) {
          p.cpmMin = lo(p.cpmMin, cpm[0][1]);
          p.cpmMax = hi(p.cpmMax, cpm[cpm.length - 1][1]);
        }
      }
    });
    return p;
  }).filter((p) => p.accounts > 0);
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function formatWeekRange(p: CarrierStatePay): string {
  if (p.weekMin == null || p.weekMax == null) return "";
  return p.weekMin === p.weekMax ? `${usd(p.weekMin)}/wk` : `${usd(p.weekMin)} – ${usd(p.weekMax)}/wk`;
}

export function formatCpmRange(p: CarrierStatePay): string {
  if (p.cpmMin == null || p.cpmMax == null) return "";
  return p.cpmMin === p.cpmMax ? `$${p.cpmMin.toFixed(2)} CPM` : `$${p.cpmMin.toFixed(2)} – $${p.cpmMax.toFixed(2)} CPM`;
}

export const formatPayRange = (p: CarrierStatePay) =>
  [formatWeekRange(p), formatCpmRange(p)].filter(Boolean).join(" · ") || "pay not listed";
