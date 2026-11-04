// Per-state records for the map. PAM / TransAm / CR England are hand-ported
// 1:1 from the original Multi_Carrier_Pay_Map.html (HTML in `detail`
// preserved verbatim). Swift / USX / J.B. Hunt / Hub Group are account-based:
// a state's record lists every open account hiring there (accounts.ts),
// with the choropleth value = average of those accounts' weekly pay.
import { mean as d3mean, max as d3max } from "d3-array";
import { carrierAccounts, formatPay } from "./accounts";
import {
  CARRIERS,
  CRE_ACCOUNTS,
  CRE_CADENCE_LABEL,
  PAM_DOMICILES,
  PAM_TIER_CPM,
  TRANSAM_HIRE_STATES,
  TRANSAM_NOHIRE_STATES,
  USX_LOYALTY,
  USX_OTR_SOLO_REGIONS,
  USX_SHORTHAUL,
  USX_STATE_REGION,
} from "./data";
import type { Account, AccountRow, CarrierId, CpmTier, StateRecord } from "./types";

export function isFlatCategory(carrierId: CarrierId, cat: string): boolean {
  return (
    (carrierId === "usx" && cat === "OTR Team Company") ||
    (carrierId === "transam" && cat === "Hiring Area")
  );
}

export function money(n: number | null | undefined): string {
  return n == null ? "?" : "$" + n.toLocaleString();
}

/* ---- account-based carriers (Swift / USX / J.B. Hunt / Hub Group) ---- */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function accountDetailHtml(a: Account): string {
  const meta = [
    a.hometime && `Home time: ${esc(a.hometime)}`,
    a.experience && `Experience: ${esc(a.experience)}`,
    a.sob && `Bonus: ${esc(a.sob)}`,
  ].filter(Boolean);
  return `<div class="acct"><div class="name">${esc(a.name)}${
    a.approval === "Yes" ? ' <span class="apprBadge">needs approval</span>' : ""
  }</div>
    <div class="sub">${esc(formatPay(a))}</div>
    ${meta.length ? `<div class="sub">${meta.join(" · ")}</div>` : ""}
    ${a.notes ? `<div class="sub" style="color:#9aa0ad">${esc(a.notes)}</div>` : ""}
  </div>`;
}

function accountRecord(carrierId: CarrierId, cat: string, state: string): StateRecord | null {
  const matches = carrierAccounts(carrierId, cat, state);
  if (!matches.length) return null;
  const paid = matches.filter((a) => a.payHigh != null).map((a) => a.payHigh as number);
  const value = paid.length ? (d3mean(paid) ?? null) : null;
  const needApproval = matches.filter((a) => a.approval === "Yes").length;
  const lines = matches.map((a) => `${a.name}: ${formatPay(a)}`);
  return {
    value,
    tooltipLines: [
      `${cat}: ${matches.length} account${matches.length > 1 ? "s" : ""}`,
      ...(value != null ? [`Avg pay: ${money(Math.round(value))}/wk`] : []),
      ...(needApproval ? [`Needs approval: ${needApproval} of ${matches.length}`] : []),
      ...lines.slice(0, 2),
    ],
    detail: matches.map(accountDetailHtml).join(""),
  };
}

function accountRows(carrierId: CarrierId, cat: string, state: string): AccountRow[] {
  return carrierAccounts(carrierId, cat, state).map((a) => ({
    account: a.name,
    approval: a.approval || "—",
    pay: formatPay(a),
    hometime: a.hometime,
    notes: [a.sob && `Bonus: ${a.sob}`, a.experience && `Experience: ${a.experience}`, a.notes]
      .filter(Boolean)
      .join(" · "),
  }));
}

/* ---- USX OTR Solo: pay is by CPM region, not per terminal ---- */
function usxCpmTable(cpmArr: CpmTier[]): string {
  return `<table class="cpm"><tr><th>Tenure</th><th>CPM</th></tr>${cpmArr
    .map(([t, v]) => `<tr><td>${t}</td><td>$${v.toFixed(2)}</td></tr>`)
    .join("")}</table>`;
}

function usxOtrSoloState(state: string): StateRecord | null {
  const region = USX_STATE_REGION[state];
  if (!region) return null;
  const r = USX_OTR_SOLO_REGIONS[region];
  const top = r.cpm[r.cpm.length - 1][1];
  const bases = carrierAccounts("usx", "OTR Solo Company", state);
  return {
    value: top,
    tooltipLines: [
      `OTR Solo Company — ${region} region`,
      `CPM range: $${r.cpm[0][1].toFixed(2)} – $${top.toFixed(2)}`,
      bases.length ? `Hiring bases: ${bases.map((b) => b.name).join(", ")}` : `No hiring base covers this state`,
    ],
    detail: `${bases.length ? `<div style="margin-bottom:8px"><b>Hiring bases covering this state</b></div>${bases.map(accountDetailHtml).join("")}` : ""}
      <div style="margin-top:8px"><b>${region} region</b> — pay is region-based, not per-terminal.</div>
      ${usxCpmTable(r.cpm)}
      <div style="margin-top:8px"><b>Loyalty pay adder (stacks on base CPM):</b></div>
      <table class="cpm"><tr><th>USX tenure</th><th>Adder</th></tr>${USX_LOYALTY.map(
        ([t, v]) => `<tr><td>${t}</td><td>${v}</td></tr>`
      ).join("")}</table>
      <div style="margin-top:8px"><b>Minimum short-haul pay</b> (pickup/delivery to customer locations, excludes terminal transfers):</div>
      <table class="cpm"><tr><th>Miles</th><th>Min pay</th></tr>${USX_SHORTHAUL.map(
        ([t, v]) => `<tr><td>${t}</td><td>${v}</td></tr>`
      ).join("")}</table>
      <div class="none" style="margin-top:6px">Montana and North Dakota are not in any of the 5 CPM regions.</div>`,
  };
}

function usxOtrSoloRows(state: string): AccountRow[] {
  const region = USX_STATE_REGION[state];
  const r = region ? USX_OTR_SOLO_REGIONS[region] : null;
  const pay = r ? `$${r.cpm[0][1].toFixed(2)}–$${r.cpm[r.cpm.length - 1][1].toFixed(2)} CPM by tenure (${region} region, + loyalty pay up to $0.06/mi)` : "";
  return accountRows("usx", "OTR Solo Company", state).map((row) => ({ ...row, pay: pay || row.pay }));
}

/* ---- PAM ---- */
function abbrev(state: string): string {
  return state;
}

function pamState(cat: string, state: string): StateRecord | null {
  if (cat !== "OTR") return null;
  const doms = PAM_DOMICILES.filter((d) => d.state === state);
  if (!doms.length) return null;
  const vals = doms.map((d) => PAM_TIER_CPM[d.tier]?.yr3).filter((v): v is number => v != null);
  const value = vals.length ? (d3max(vals) ?? null) : null;
  return {
    value,
    tooltipLines: [
      `PAM OTR domiciles: ${doms.length}`,
      ...doms.map((d) => `${d.city} — ${d.tier} (${d.hometime})`).slice(0, 3),
    ],
    detail: `${doms
      .map((d) => {
        const c = PAM_TIER_CPM[d.tier];
        return `<div class="acct"><div class="name">${d.city}, ${abbrev(state)} — ${d.tier}${
          d.division ? " · " + d.division + " division" : ""
        }</div>
          <div class="sub">Home time: ${d.hometime}${
          c.yr3 != null ? ` · Year 3 CPM: $${c.yr3.toFixed(2)}` : " · pay tier not yet confirmed"
        }</div></div>`;
      })
      .join("")}
      <div style="margin-top:10px"><b>Tenure × tier CPM (all tiers get up to +$0.10/mi weekly performance pay):</b></div>
      <table class="cpm"><tr><th>Tenure</th><th>Tier 1</th><th>Tier 2</th><th>Tier 3</th><th>Tier 7</th></tr>
        <tr><td>0mo (student)</td><td>$0.35</td><td>$0.35</td><td>$0.35</td><td>$0.35</td></tr>
        <tr><td>3mo</td><td>$0.45</td><td>$0.50</td><td>$0.55</td><td>$0.70</td></tr>
        <tr><td>Year 1</td><td>$0.50</td><td>$0.55</td><td>$0.60</td><td>TBD</td></tr>
        <tr><td>Year 3</td><td>$0.55</td><td>$0.60</td><td>$0.65</td><td>TBD</td></tr>
      </table>
      <div class="none" style="margin-top:6px">PAM coverage is domicile-based with a ~90-mile hiring radius, not full-state — this state is shown because it contains a PAM domicile, not because PAM hires anywhere in the state.</div>`,
  };
}

function pamAccountRows(cat: string, state: string): AccountRow[] {
  if (cat !== "OTR") return [];
  const doms = PAM_DOMICILES.filter((d) => d.state === state);
  return doms.map((d) => {
    const c = PAM_TIER_CPM[d.tier];
    return {
      account: `${d.city}, ${abbrev(state)} — ${d.tier}${d.division ? " · " + d.division + " division" : ""}`,
      approval: "—",
      pay: c.yr3 != null ? `$${c.yr3.toFixed(2)} CPM @ Year 3 (up to +$0.10/mi weekly performance pay)` : "Pay tier not yet confirmed",
      hometime: d.hometime,
      notes: "90-mile hiring radius around this domicile, not full-state coverage.",
    };
  });
}

/* ---- CR ENGLAND ---- */
function creState(cat: string, state: string): StateRecord | null {
  const matches = CRE_ACCOUNTS.filter((a) => CRE_CADENCE_LABEL[a.cadence] === cat && a.states.includes(state));
  if (!matches.length) return null;
  const paid = matches.filter((a) => a.avgWeekly != null).map((a) => a.avgWeekly as number);
  const value = paid.length ? (d3mean(paid) ?? null) : null;
  const lines = matches.map((a) => `${a.name}: ${a.avgWeekly != null ? money(a.avgWeekly) + "/wk avg" : "pay not confirmed"}`);
  return {
    value,
    tooltipLines: [`${cat}: ${matches.length} account${matches.length > 1 ? "s" : ""}`, ...lines.slice(0, 3)],
    detail: `${matches
      .map(
        (a) =>
          `<div class="acct"><div class="name">${a.name}${a.type ? " · " + a.type : ""}${a.bonusLane ? " · Bonus Lane" : ""}</div>
        <div class="sub">${
          a.avgWeekly != null
            ? `Avg ${money(a.avgWeekly)}/wk (${money(a.avgAnnual)}/yr)` +
              (a.top10Weekly != null ? ` · Top10 ${money(a.top10Weekly)}/wk (${money(a.top10Annual)}/yr)` : "")
            : "Pay not confirmed"
        }</div>
        <div class="sub">Home time: ${a.hometime}</div>
        ${a.notes && a.notes !== "none" ? `<div class="sub" style="color:#9aa0ad">${a.notes}</div>` : ""}
      </div>`
      )
      .join("")}`,
  };
}

function creAccountRows(cat: string, state: string): AccountRow[] {
  const matches = CRE_ACCOUNTS.filter((a) => CRE_CADENCE_LABEL[a.cadence] === cat && a.states.includes(state));
  return matches.map((a) => ({
    account: `${a.name}${a.type ? " · " + a.type : ""}${a.bonusLane ? " · Bonus Lane" : ""}`,
    approval: "—",
    pay:
      a.avgWeekly != null
        ? `Avg ${money(a.avgWeekly)}/wk (${money(a.avgAnnual)}/yr)${
            a.top10Weekly != null ? ` · Top10 ${money(a.top10Weekly)}/wk (${money(a.top10Annual)}/yr)` : ""
          }`
        : "Pay not confirmed",
    hometime: a.hometime,
    notes: a.notes && a.notes !== "none" ? a.notes : "",
  }));
}

/* ---- TRANSAM ---- */
function transamState(cat: string, state: string): StateRecord | null {
  if (cat !== "Hiring Area") return null;
  if (TRANSAM_HIRE_STATES.includes(state)) {
    return {
      value: 1,
      flatNo: false,
      tooltipLines: ["TransAm hires in this state"],
      detail: `<div class="card"><h3>${state} — TransAm</h3><p>Active hiring area. No pay/tier data submitted for TransAm — coverage only.</p></div>`,
    };
  }
  if (TRANSAM_NOHIRE_STATES.includes(state)) {
    return {
      value: 0,
      flatNo: true,
      tooltipLines: ["TransAm does NOT hire in this state"],
      detail: `<div class="card"><h3>${state} — TransAm</h3><p>Not a hiring area for TransAm.</p></div>`,
    };
  }
  return null;
}

function transamAccountRows(cat: string, state: string): AccountRow[] {
  if (cat !== "Hiring Area") return [];
  if (TRANSAM_HIRE_STATES.includes(state)) {
    return [{ account: "TransAm hiring area", approval: "—", pay: "Coverage only — no pay/tier data submitted", hometime: "", notes: "Active hiring area." }];
  }
  if (TRANSAM_NOHIRE_STATES.includes(state)) {
    return [{ account: "TransAm hiring area", approval: "—", pay: "—", hometime: "", notes: "Not a hiring area for TransAm." }];
  }
  return [];
}

/* ---- dispatcher ---- */
export function getStateRecord(carrierId: CarrierId, cat: string, state: string): StateRecord | null {
  if (carrierId === "usx" && cat === "OTR Solo Company") return usxOtrSoloState(state);
  if (carrierId === "pam") return pamState(cat, state);
  if (carrierId === "transam") return transamState(cat, state);
  if (carrierId === "cre") return creState(cat, state);
  return accountRecord(carrierId, cat, state);
}

export function getStateAccountRows(carrierId: CarrierId, cat: string, state: string): AccountRow[] {
  if (carrierId === "usx" && cat === "OTR Solo Company") return usxOtrSoloRows(state);
  if (carrierId === "pam") return pamAccountRows(cat, state);
  if (carrierId === "transam") return transamAccountRows(cat, state);
  if (carrierId === "cre") return creAccountRows(cat, state);
  return accountRows(carrierId, cat, state);
}

export function carrierSummaryLines(carrierId: CarrierId, state: string): string[] {
  const cats = CARRIERS[carrierId].cats;
  const out: string[] = [];
  cats.forEach((cat) => {
    const rec = getStateRecord(carrierId, cat, state);
    if (rec) out.push(`<span class="cname">${cat}:</span> ${rec.tooltipLines[0]}`);
  });
  return out;
}
