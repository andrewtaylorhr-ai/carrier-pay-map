// Typed re-exports of the JSON dumped by scripts/extract-data.mjs from the
// original Multi_Carrier_Pay_Map.html. Real data, not hand-retyped — see
// src/lib/carriers/generated/*.json. Per-account data (Swift / J.B. Hunt /
// Hub Group / USX, from scripts/build-accounts.mjs) lives in accounts.ts.
import allStatesJson from "./generated/all-states.json";
import carrierOrderJson from "./generated/carrier-order.json";
import carriersJson from "./generated/carriers.json";
import creAccountsJson from "./generated/cre-accounts.json";
import creCadenceLabelJson from "./generated/cre-cadence-label.json";
import lower48Json from "./generated/lower-48.json";
import majorCitiesJson from "./generated/major-cities.json";
import stateCitiesJson from "./generated/state-cities.json";
import usStateAbbrJson from "./generated/us-state-abbr.json";
import pamDomicilesJson from "./generated/pam-domiciles.json";
import pamTierCpmJson from "./generated/pam-tier-cpm.json";
import transamHireStatesJson from "./generated/transam-hire-states.json";
import transamNoHireStatesJson from "./generated/transam-nohire-states.json";
import usxLoyaltyJson from "./generated/usx-loyalty.json";
import usxOtrSoloRegionsJson from "./generated/usx-otr-solo-regions.json";
import usxShorthaulJson from "./generated/usx-shorthaul.json";
import usxStateRegionJson from "./generated/usx-state-region.json";

import type {
  CarriersById,
  CreAccount,
  CreCadenceLabel,
  PamDomicile,
  PamTierCpm,
  UsxLoyalty,
  UsxOtrSoloRegions,
  UsxShorthaul,
  UsxStateRegion,
} from "./types";

export const CARRIERS = carriersJson as unknown as CarriersById;
export const CARRIER_ORDER = carrierOrderJson as (keyof CarriersById)[];

export const ALL_STATES = allStatesJson as string[];
export const LOWER_48 = lower48Json as string[];
// Reference city labels for the map: [name, ST, lon, lat], biggest first
// (scripts/build-cities.mjs, from the US Census Gazetteer).
export const MAJOR_CITIES = majorCitiesJson as [string, string, number, number][];
// Every city of 10,000+ (at least 15 per state) by state code: [name, lon, lat, population],
// biggest first (scripts/build-state-cities.mjs) — drawn when the map zooms into a state.
export const STATE_CITIES = stateCitiesJson as unknown as Record<string, [string, number, number, number][]>;
// full state name -> 2-letter code ("Texas" -> "TX")
export const STATE_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(usStateAbbrJson as Record<string, string>).map(([code, name]) => [name, code])
);

export const USX_OTR_SOLO_REGIONS = usxOtrSoloRegionsJson as unknown as UsxOtrSoloRegions;
export const USX_LOYALTY = usxLoyaltyJson as UsxLoyalty;
export const USX_SHORTHAUL = usxShorthaulJson as UsxShorthaul;
export const USX_STATE_REGION = usxStateRegionJson as UsxStateRegion;

export const PAM_DOMICILES = pamDomicilesJson as PamDomicile[];
export const PAM_TIER_CPM = pamTierCpmJson as unknown as PamTierCpm;

export const TRANSAM_HIRE_STATES = transamHireStatesJson as string[];
export const TRANSAM_NOHIRE_STATES = transamNoHireStatesJson as string[];

export const CRE_CADENCE_LABEL = creCadenceLabelJson as CreCadenceLabel;
export const CRE_ACCOUNTS = creAccountsJson as CreAccount[];
