// Typed re-exports of the JSON dumped by scripts/extract-data.mjs from the
// original Multi_Carrier_Pay_Map.html. Real data, not hand-retyped — see
// src/lib/carriers/generated/*.json.
import allStatesJson from "./generated/all-states.json";
import carrierOrderJson from "./generated/carrier-order.json";
import carriersJson from "./generated/carriers.json";
import creAccountsJson from "./generated/cre-accounts.json";
import creCadenceLabelJson from "./generated/cre-cadence-label.json";
import lower48Json from "./generated/lower-48.json";
import pamDomicilesJson from "./generated/pam-domiciles.json";
import pamTierCpmJson from "./generated/pam-tier-cpm.json";
import swiftDataJson from "./generated/swift-data.json";
import transamHireStatesJson from "./generated/transam-hire-states.json";
import transamNoHireStatesJson from "./generated/transam-nohire-states.json";
import usxDailyTeamNoteJson from "./generated/usx-daily-team-note.json";
import usxDedicatedDailyTeamJson from "./generated/usx-dedicated-daily-team.json";
import usxDedicatedHomeWeeklyJson from "./generated/usx-dedicated-home-weekly.json";
import usxLoyaltyJson from "./generated/usx-loyalty.json";
import usxOtrRegionalJson from "./generated/usx-otr-regional.json";
import usxOtrSoloRegionsJson from "./generated/usx-otr-solo-regions.json";
import usxShorthaulJson from "./generated/usx-shorthaul.json";
import usxStateRegionJson from "./generated/usx-state-region.json";

import type {
  CarriersById,
  CreAccount,
  CreCadenceLabel,
  PamDomicile,
  PamTierCpm,
  SwiftData,
  UsxDedicatedAccount,
  UsxLoyalty,
  UsxOtrRegional,
  UsxOtrSoloRegions,
  UsxShorthaul,
  UsxStateRegion,
} from "./types";

export const CARRIERS = carriersJson as unknown as CarriersById;
export const CARRIER_ORDER = carrierOrderJson as (keyof CarriersById)[];

export const ALL_STATES = allStatesJson as string[];
export const LOWER_48 = lower48Json as string[];

export const SWIFT_DATA = swiftDataJson as unknown as SwiftData;

export const USX_OTR_SOLO_REGIONS = usxOtrSoloRegionsJson as unknown as UsxOtrSoloRegions;
export const USX_LOYALTY = usxLoyaltyJson as UsxLoyalty;
export const USX_SHORTHAUL = usxShorthaulJson as UsxShorthaul;
export const USX_STATE_REGION = usxStateRegionJson as UsxStateRegion;
export const USX_DEDICATED_HOME_WEEKLY = usxDedicatedHomeWeeklyJson as UsxDedicatedAccount[];
export const USX_DEDICATED_DAILY_TEAM = usxDedicatedDailyTeamJson as UsxDedicatedAccount[];
export const USX_DAILY_TEAM_NOTE = usxDailyTeamNoteJson as string;
export const USX_OTR_REGIONAL = usxOtrRegionalJson as unknown as UsxOtrRegional;

export const PAM_DOMICILES = pamDomicilesJson as PamDomicile[];
export const PAM_TIER_CPM = pamTierCpmJson as unknown as PamTierCpm;

export const TRANSAM_HIRE_STATES = transamHireStatesJson as string[];
export const TRANSAM_NOHIRE_STATES = transamNoHireStatesJson as string[];

export const CRE_CADENCE_LABEL = creCadenceLabelJson as CreCadenceLabel;
export const CRE_ACCOUNTS = creAccountsJson as CreAccount[];
