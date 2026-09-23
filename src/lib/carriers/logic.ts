// Hand-ported (not auto-extracted) 1:1 from the original Multi_Carrier_Pay_Map.html
// swiftState/usxState/pamState/transamState/creState functions and their
// *AccountRows counterparts + dispatchers. Behavior, including the HTML
// strings in `detail`, is preserved verbatim from the source app.
import { mean as d3mean, max as d3max } from "d3-array";
import {
  CARRIERS,
  CRE_ACCOUNTS,
  CRE_CADENCE_LABEL,
  LOWER_48,
  PAM_DOMICILES,
  PAM_TIER_CPM,
  SWIFT_DATA,
  TRANSAM_HIRE_STATES,
  TRANSAM_NOHIRE_STATES,
  USX_DAILY_TEAM_NOTE,
  USX_DEDICATED_DAILY_TEAM,
  USX_DEDICATED_HOME_WEEKLY,
  USX_LOYALTY,
  USX_OTR_REGIONAL,
  USX_OTR_SOLO_REGIONS,
  USX_SHORTHAUL,
  USX_STATE_REGION,
} from "./data";
import type { AccountRow, CarrierId, CpmTier, StateRecord } from "./types";

export function isFlatCategory(carrierId: CarrierId, cat: string): boolean {
  return (
    (carrierId === "usx" && cat === "OTR Team Company") ||
    (carrierId === "transam" && cat === "Hiring Area")
  );
}

export function money(n: number | null | undefined): string {
  return n == null ? "?" : "$" + n.toLocaleString();
}

/* ---- SWIFT ---- */
function acctListSimple(accts: string[]): string {
  if (!accts.length) return '<span class="none">none</span>';
  return accts.map((a) => `<div class="acct">${a}</div>`).join("");
}

function swiftState(cat: string, state: string): StateRecord | null {
  const rec = SWIFT_DATA[cat]?.[state];
  if (!rec) return null;
  const payLine = `Avg pay: ${money(rec.avg_low)}–${money(rec.avg_high)}/wk (true max ${money(rec.max_high)})`;
  return {
    value: rec.avg_high,
    tooltipLines: [
      `${cat}: ${rec.n} posting${rec.n > 1 ? "s" : ""}`,
      payLine,
      `Needs approval: ${rec.n_yes} yes / ${rec.n_no} no`,
    ],
    detail: `<div class="cols">
        <div>
          <div class="col-title yes">Needs leadership approval (${rec.n_yes})</div>
          ${acctListSimple(rec.yes_accts)}
        </div>
        <div>
          <div class="col-title no">No approval needed (${rec.n_no})</div>
          ${acctListSimple(rec.no_accts)}
        </div>
      </div>`,
  };
}

function swiftAccountRows(cat: string, state: string): AccountRow[] {
  const rec = SWIFT_DATA[cat]?.[state];
  if (!rec) return [];
  const pay = `${money(rec.avg_low)}–${money(rec.avg_high)}/wk (true max ${money(rec.max_high)})`;
  const rows: AccountRow[] = [];
  rec.yes_accts.forEach((name) => rows.push({ account: name, approval: "Yes", pay, hometime: "", notes: "" }));
  rec.no_accts.forEach((name) => rows.push({ account: name, approval: "No", pay, hometime: "", notes: "" }));
  if (!rows.length) {
    rows.push({
      account: "(no individual accounts listed)",
      approval: "—",
      pay,
      hometime: "",
      notes: `${rec.n} posting(s) total`,
    });
  }
  return rows;
}

/* ---- USX ---- */
function usxCpmTable(cpmArr: CpmTier[]): string {
  return `<table class="cpm"><tr><th>Tenure</th><th>CPM</th></tr>${cpmArr
    .map(([t, v]) => `<tr><td>${t}</td><td>$${v.toFixed(2)}</td></tr>`)
    .join("")}</table>`;
}

function usxState(cat: string, state: string): StateRecord | null {
  if (cat === "OTR Solo Company") {
    const region = USX_STATE_REGION[state];
    if (!region) return null;
    const r = USX_OTR_SOLO_REGIONS[region];
    const top = r.cpm[r.cpm.length - 1][1];
    return {
      value: top,
      tooltipLines: [
        `OTR Solo Company — ${region} region`,
        `CPM range: $${r.cpm[0][1].toFixed(2)} – $${top.toFixed(2)}`,
        `+ loyalty pay up to $0.06/mi at 48mo+`,
      ],
      detail: `<div><b>${region} region</b> — pay is region-based, not per-terminal.</div>
        ${usxCpmTable(r.cpm)}
        <div style="margin-top:8px"><b>Loyalty pay adder (stacks on base CPM):</b></div>
        <table class="cpm"><tr><th>USX tenure</th><th>Adder</th></tr>${USX_LOYALTY.map(
          ([t, v]) => `<tr><td>${t}</td><td>${v}</td></tr>`
        ).join("")}</table>
        <div style="margin-top:8px"><b>Minimum short-haul pay</b> (pickup/delivery to customer locations, excludes terminal transfers):</div>
        <table class="cpm"><tr><th>Miles</th><th>Min pay</th></tr>${USX_SHORTHAUL.map(
          ([t, v]) => `<tr><td>${t}</td><td>${v}</td></tr>`
        ).join("")}</table>
        <div class="none" style="margin-top:6px">Montana and North Dakota are not in any of the 5 CPM regions and are excluded from OTR Solo pay zones.</div>`,
    };
  }
  if (cat === "OTR Team Company") {
    if (!LOWER_48.includes(state)) return null;
    return {
      value: null,
      flatNo: false,
      tooltipLines: [
        `OTR Team Company — drive across all 48 states`,
        `$10,000 split sign-on bonus (team)`,
        `No published base pay rate captured`,
      ],
      detail: `<div class="card"><h3>${state} — OTR Team Company</h3>
        <p>Coverage-only listing: "Drive Across All 48 States." $10,000 split sign-on bonus (team). No specific CPM/weekly pay figure was captured from the source data — confirm with USX before quoting to a driver.</p></div>`,
    };
  }
  if (cat === "OTR Regional") {
    const ne = USX_OTR_REGIONAL.northeast;
    if (!ne.states.includes(state)) return null;
    const top = ne.cpm[ne.cpm.length - 1][1];
    return {
      value: top,
      tooltipLines: [
        `OTR Regional — Northeast sub-fleet (approx.)`,
        `CPM range: $${ne.cpm[0][1].toFixed(2)} – $${top.toFixed(2)}`,
        `Top 20% earn $1,700+/wk`,
      ],
      detail: `<div><b>Northeast sub-fleet</b> — ${ne.note}</div>
        ${usxCpmTable(ne.cpm)}
        <div class="none" style="margin-top:6px">Southeast sub-fleet (Ellenwood, GA): ${USX_OTR_REGIONAL.southeast.note}</div>
        <div class="none" style="margin-top:4px">West Coast sub-fleet: ${USX_OTR_REGIONAL.westcoast.note}</div>`,
    };
  }
  if (cat === "Dedicated Home Weekly" || cat === "Dedicated Daily/Frequently/Team") {
    const list = cat === "Dedicated Home Weekly" ? USX_DEDICATED_HOME_WEEKLY : USX_DEDICATED_DAILY_TEAM;
    const matches = list.filter((a) => a.states.includes(state));
    if (!matches.length) return null;
    const paid = matches.filter((a) => a.payHigh != null).map((a) => a.payHigh as number);
    const value = paid.length ? (d3mean(paid) ?? null) : null;
    const lines = matches.map(
      (a) =>
        a.name +
        ": " +
        (a.payLow != null ? `${money(a.payLow)}${a.payHigh !== a.payLow ? "–" + money(a.payHigh) : ""}/wk` : "pay not confirmed")
    );
    return {
      value,
      tooltipLines: [`${cat}: ${matches.length} account${matches.length > 1 ? "s" : ""}`, ...lines.slice(0, 3)],
      detail: `${matches
        .map(
          (a) =>
            `<div class="acct"><div class="name">${a.name}</div><div class="sub">${
              a.payLow != null
                ? money(a.payLow) + (a.payHigh !== a.payLow ? "–" + money(a.payHigh) : "") + "/wk"
                : "Pay not confirmed"
            }${a.note ? " — " + a.note : ""}</div></div>`
        )
        .join("")}
        ${cat === "Dedicated Daily/Frequently/Team" ? `<div class="none" style="margin-top:8px">${USX_DAILY_TEAM_NOTE}</div>` : ""}`,
    };
  }
  return null;
}

function usxAccountRows(cat: string, state: string): AccountRow[] {
  if (cat === "OTR Solo Company") {
    const region = USX_STATE_REGION[state];
    if (!region) return [];
    const r = USX_OTR_SOLO_REGIONS[region];
    const top = r.cpm[r.cpm.length - 1][1];
    return [
      {
        account: `${region} region (all OTR Solo Company accounts)`,
        approval: "—",
        pay: `$${r.cpm[0][1].toFixed(2)}–$${top.toFixed(2)} CPM by tenure (+ loyalty pay up to $0.06/mi at 48mo+)`,
        hometime: "",
        notes: "Pay is region-based, not per-terminal. Minimum short-haul pay table applies for local/short runs.",
      },
    ];
  }
  if (cat === "OTR Team Company") {
    if (!LOWER_48.includes(state)) return [];
    return [
      {
        account: "Drive Across All 48 States (Team)",
        approval: "—",
        pay: "$10,000 split sign-on bonus (team); no base CPM/weekly rate captured",
        hometime: "",
        notes: "Coverage-only listing — confirm base pay with USX before quoting to a driver.",
      },
    ];
  }
  if (cat === "OTR Regional") {
    const ne = USX_OTR_REGIONAL.northeast;
    if (!ne.states.includes(state)) return [];
    const top = ne.cpm[ne.cpm.length - 1][1];
    return [
      {
        account: "Northeast sub-fleet",
        approval: "—",
        pay: `$${ne.cpm[0][1].toFixed(2)}–$${top.toFixed(2)} CPM by tenure`,
        hometime: "",
        notes: `Top 20% earn $1,700+/wk. Southeast (Ellenwood GA, $1,100/wk) and West Coast ($1,100/wk) sub-fleets have no confirmed state list and are not mapped here.`,
      },
    ];
  }
  if (cat === "Dedicated Home Weekly" || cat === "Dedicated Daily/Frequently/Team") {
    const list = cat === "Dedicated Home Weekly" ? USX_DEDICATED_HOME_WEEKLY : USX_DEDICATED_DAILY_TEAM;
    const matches = list.filter((a) => a.states.includes(state));
    return matches.map((a) => ({
      account: a.name,
      approval: "—",
      pay: a.payLow != null ? `${money(a.payLow)}${a.payHigh !== a.payLow ? "–" + money(a.payHigh) : ""}/wk` : "Pay not confirmed",
      hometime: "",
      notes: a.note || "",
    }));
  }
  return [];
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
        ${a.notes && a.notes !== "none" ? `<div class="sub" style="color:#888">${a.notes}</div>` : ""}
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
  if (carrierId === "swift") return swiftState(cat, state);
  if (carrierId === "usx") return usxState(cat, state);
  if (carrierId === "pam") return pamState(cat, state);
  if (carrierId === "transam") return transamState(cat, state);
  if (carrierId === "cre") return creState(cat, state);
  return null;
}

export function getStateAccountRows(carrierId: CarrierId, cat: string, state: string): AccountRow[] {
  if (carrierId === "swift") return swiftAccountRows(cat, state);
  if (carrierId === "usx") return usxAccountRows(cat, state);
  if (carrierId === "pam") return pamAccountRows(cat, state);
  if (carrierId === "transam") return transamAccountRows(cat, state);
  if (carrierId === "cre") return creAccountRows(cat, state);
  return [];
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
