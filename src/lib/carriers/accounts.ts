// Every carrier's open accounts as one flat list of `Account`s — what the
// Strategy Builder assigns to recruiters, and what the pay map aggregates
// per state. Swift / J.B. Hunt / Hub Group / USX are generated from the
// carriers' own files (scripts/build-accounts.mjs); PAM / TransAm / CR
// England are adapted here from their original data shapes.
import accountsHubJson from "./generated/accounts-hub.json";
import accountsJbhJson from "./generated/accounts-jbh.json";
import accountsSwiftJson from "./generated/accounts-swift.json";
import accountsUsxJson from "./generated/accounts-usx.json";
import { CARRIER_ORDER, CRE_ACCOUNTS, CRE_CADENCE_LABEL, PAM_DOMICILES, PAM_TIER_CPM, TRANSAM_HIRE_STATES } from "./data";
import type { Account, CarrierId } from "./types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const PAM_ACCOUNTS: Account[] = PAM_DOMICILES.map((d) => {
  const yr3 = PAM_TIER_CPM[d.tier]?.yr3;
  return {
    id: `pam:${slug(d.city)}-${slug(d.state)}:otr`,
    carrier: "pam",
    name: `${d.city} — ${d.tier}${d.division ? ` · ${d.division}` : ""}`,
    cat: "OTR",
    states: [d.state],
    payLow: null,
    payHigh: null,
    payText: yr3 != null ? `$${yr3.toFixed(2)} CPM @ Year 3 (up to +$0.10/mi weekly performance pay)` : "Pay tier not yet confirmed",
    hometime: d.hometime,
    approval: "",
    experience: "",
    sob: "",
    notes: "90-mile hiring radius around this domicile, not full-state coverage.",
  };
});

const TRANSAM_ACCOUNTS: Account[] = [
  {
    id: "transam:hiring-area:hiring-area",
    carrier: "transam",
    name: "TransAm — hiring area",
    cat: "Hiring Area",
    states: TRANSAM_HIRE_STATES,
    payLow: null,
    payHigh: null,
    payText: "Coverage only — no pay/tier data submitted",
    hometime: "",
    approval: "",
    experience: "",
    sob: "",
    notes: "",
  },
];

const CRE_ACCOUNTS_ADAPTED: Account[] = CRE_ACCOUNTS.map((a, i) => ({
  id: `cre:${slug(a.name)}-${i}`,
  carrier: "cre",
  name: `${a.name}${a.type ? " · " + a.type : ""}${a.bonusLane ? " · Bonus Lane" : ""}`,
  cat: CRE_CADENCE_LABEL[a.cadence],
  states: a.states,
  payLow: a.avgWeekly ?? null,
  payHigh: a.avgWeekly ?? null,
  payText:
    a.avgWeekly != null
      ? `Avg $${a.avgWeekly.toLocaleString()}/wk` +
        (a.top10Weekly != null ? ` · Top10 $${a.top10Weekly.toLocaleString()}/wk` : "")
      : "Pay not confirmed",
  hometime: a.hometime,
  approval: "",
  experience: "",
  sob: "",
  notes: a.notes && a.notes !== "none" ? a.notes : "",
}));

const BY_CARRIER: Record<CarrierId, Account[]> = {
  swift: accountsSwiftJson as Account[],
  usx: accountsUsxJson as Account[],
  jbh: accountsJbhJson as Account[],
  hub: accountsHubJson as Account[],
  pam: PAM_ACCOUNTS,
  transam: TRANSAM_ACCOUNTS,
  cre: CRE_ACCOUNTS_ADAPTED,
};

export const ALL_ACCOUNTS: Account[] = CARRIER_ORDER.flatMap((id) => BY_CARRIER[id]);
export const ACCOUNTS_BY_ID: Map<string, Account> = new Map(ALL_ACCOUNTS.map((a) => [a.id, a]));

export function carrierAccounts(carrier: CarrierId, cat?: string, state?: string): Account[] {
  return BY_CARRIER[carrier].filter((a) => (!cat || a.cat === cat) && (!state || a.states.includes(state)));
}

// Accounts hiring in any of `states`, optionally limited to some carriers.
export function accountsInStates(states: string[], carriers?: CarrierId[]): Account[] {
  const set = new Set(states);
  return ALL_ACCOUNTS.filter((a) => (!carriers || carriers.includes(a.carrier)) && a.states.some((s) => set.has(s)));
}

export function formatPay(a: Account): string {
  if (a.payText) return a.payText;
  if (a.payLow == null) return "Pay not listed";
  return `$${a.payLow.toLocaleString()}${a.payHigh != null && a.payHigh !== a.payLow ? "–$" + a.payHigh.toLocaleString() : ""}/wk`;
}
