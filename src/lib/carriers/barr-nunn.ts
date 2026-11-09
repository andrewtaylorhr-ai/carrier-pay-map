// Barr-Nunn, hand-entered from "BN Information 09302026.xlsx" (one sheet per
// fleet, plus Misc Info / Orientation / Equipment / Pet Policy). Each fleet is
// one account. Hiring states come from each fleet's hiring-area map picture
// (and its state list where the sheet gives one). Barr-Nunn pays per mile, so
// weekly pay is an estimate: starting CPM × the average weekly miles on the
// Misc Info sheet (Regional 1,900–2,200, OTR 2,000–2,400). Team fleets show
// their CPM (and gross, where the sheet gives it) as text only.
import type { Account } from "./types";

type Fleet = Omit<Account, "cities" | "carrier" | "approval" | "experience" | "sob">;

const MILES = { regional: [1900, 2200], otr: [2000, 2400] } as const;
const round10 = (n: number) => Math.round(n / 10) * 10;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

// Solo fleet pay: starting CPM range + estimated weekly pay from average miles.
function soloPay(lo: number, hi: number, miles: readonly [number, number]) {
  const wLo = round10(lo * miles[0]);
  const wHi = round10(hi * miles[1]);
  return {
    payLow: wLo,
    payHigh: wHi,
    payText: `$${lo.toFixed(2)}–$${hi.toFixed(2)} CPM to start · est. ${usd(wLo)}–${usd(wHi)}/wk (${miles[0].toLocaleString()}–${miles[1].toLocaleString()} mi/wk)`,
  };
}

// The hiring areas, as full state names.
const NORTH = ["Pennsylvania", "Ohio", "New Jersey", "Connecticut", "Massachusetts", "Rhode Island", "Maryland", "Virginia"];
const ELEVEN_NORTH_SOLO = [
  "Illinois",
  "Indiana",
  "Ohio",
  "Kentucky",
  "Pennsylvania",
  "Maryland",
  "Virginia",
  "New Jersey",
  "Connecticut",
  "Massachusetts",
  "Rhode Island",
  "Tennessee",
  "North Carolina",
  "South Carolina",
  "Georgia",
];
const ELEVEN_NORTH_TEAM = ELEVEN_NORTH_SOLO;
const OTR18_SOLO = [
  "Wisconsin",
  "Iowa",
  "Michigan",
  "Illinois",
  "Indiana",
  "Kentucky",
  "Tennessee",
  "West Virginia",
  "Virginia",
  "Maryland",
  "Delaware",
  "North Carolina",
  "South Carolina",
  "Georgia",
  "New Hampshire",
];
// The OTR 18 Team map, which is also the whole Barr-Nunn hiring area
// ("drivers can live anywhere in our hiring area" for the terminal fleets).
const HIRING_AREA = [
  "Iowa",
  "Wisconsin",
  "Illinois",
  "Michigan",
  "Indiana",
  "Ohio",
  "Kentucky",
  "West Virginia",
  "Virginia",
  "Maryland",
  "Delaware",
  "Pennsylvania",
  "New Jersey",
  "Connecticut",
  "Massachusetts",
  "Rhode Island",
  "North Carolina",
  "South Carolina",
  "Georgia",
  "Tennessee",
];
const OTR21_SOLO = [
  "Iowa",
  "Arizona",
  "New Mexico",
  "Colorado",
  "Nebraska",
  "Oklahoma",
  "North Dakota",
  "South Dakota",
  "Wyoming",
  "Montana",
  "Utah",
  "Idaho",
  "Kansas",
  "Missouri",
];
const OTR21_TEAM = [
  "Montana",
  "Idaho",
  "Wyoming",
  "Utah",
  "Arizona",
  "Colorado",
  "New Mexico",
  "North Dakota",
  "South Dakota",
  "Nebraska",
  "Kansas",
  "Oklahoma",
  "Minnesota",
  "Iowa",
  "Missouri",
  "Arkansas",
  "Louisiana",
  "Wisconsin",
  "Michigan",
  "Tennessee",
  "Mississippi",
  "Alabama",
  "Florida",
  "Maine",
  "New Hampshire",
  "Vermont",
];

const TRUCK_HOME = "Takes the truck and an empty trailer home (needs own parking, not paid for).";
const BOBTAIL_YES = "May be able to drop the trailer at a customer and bobtail home.";
const BOBTAIL_NO = "Can't drop the trailer at a customer to bobtail home.";
const HOLIDAY = (days: number, from: string) => `Holiday fleet: runs 25 days straight from ${from} until late December, then ${days} days off.`;
const TERMINALS = "Leaves the truck at the Columbus OH or Shippensburg PA terminal and gets home on their own (within 50 miles of either one can take the truck home).";

const FLEETS: Fleet[] = [
  {
    id: "barr:regional-central",
    name: "Regional Central · Solo",
    cat: "Regional",
    states: ["Illinois", "Indiana", "Kentucky", "Michigan", "Ohio"],
    ...soloPay(0.7, 0.74, MILES.regional),
    hometime: "Home every weekend, 48 hours",
    notes: [
      "Hiring area: within 75 miles of Chicago and Indianapolis, 50 miles of Louisville KY, Detroit and Grand Rapids, and the entire state of Ohio.",
      "Runs the whole network (mostly Midwest, can go Northeast / Southeast).",
      "CPM by experience (cap in brackets): 8–29 mo $0.70 ($0.78), 30+ mo $0.72 ($0.78); with hazmat 8–29 mo $0.72 ($0.80), 30+ mo $0.74 ($0.80).",
      "Barr-Nunn advertises this like Regional North: $85k–$105k/yr.",
      TRUCK_HOME,
    ].join(" "),
  },
  {
    id: "barr:regional-north",
    name: "Regional North · Solo",
    cat: "Regional",
    states: [...NORTH, "Indiana", "Kentucky"],
    ...soloPay(0.67, 0.71, MILES.regional),
    hometime: "Home every weekend, 48 hours (Fri night–Sun night or Sat morning–Mon morning)",
    notes: ["Hiring area: PA, OH, NJ, CT, MA, RI, MD and Northern VA; the map also shades eastern Indiana and northern Kentucky.", TRUCK_HOME, BOBTAIL_YES].join(" "),
  },
  {
    id: "barr:regional-north-weekend",
    name: "Regional North Weekend · Solo",
    cat: "Regional",
    states: [...NORTH, "Indiana", "Kentucky"],
    ...soloPay(0.69, 0.73, MILES.regional),
    hometime: "Home every Monday and Tuesday, 48 hours",
    notes: ["Works weekends, home Mon–Tue. Same hiring area as Regional North.", TRUCK_HOME, BOBTAIL_NO].join(" "),
  },
  {
    id: "barr:midwest-regional",
    name: "Midwest Regional · Solo",
    cat: "Regional",
    states: ["Illinois", "Indiana", "Michigan", "Ohio", "Kentucky", "Tennessee", "Wisconsin", "Iowa", "Missouri"],
    ...soloPay(0.67, 0.71, MILES.regional),
    hometime: "Home every weekend, 48 hours",
    notes: [
      "The sheet lists IL, IN, MI, OH, KY, TN, WI, IA and MO, but its map only shows about 75 miles around Chicago. Check the driver's address with Barr-Nunn.",
      TRUCK_HOME,
      BOBTAIL_YES,
    ].join(" "),
  },
  {
    id: "barr:11-north",
    name: "11 North · Solo",
    cat: "11 North",
    states: ELEVEN_NORTH_SOLO,
    ...soloPay(0.67, 0.71, MILES.otr),
    hometime: "Home every other weekend for 3 full days",
    notes: ["The sheet lists PA, OH, NJ, CT, MA, RI, MD and Northern VA; the map also covers Chicago, IN, KY and the Charlotte–Atlanta area.", TRUCK_HOME, BOBTAIL_NO].join(" "),
  },
  {
    id: "barr:11-north-holiday-solo",
    name: "11 North Holiday · Solo",
    cat: "11 North",
    states: ELEVEN_NORTH_SOLO,
    ...soloPay(0.69, 0.73, MILES.otr),
    hometime: "Home every other weekend for 3 full days",
    notes: [HOLIDAY(6, "Black Friday"), "Same hiring area as 11 North.", TRUCK_HOME, BOBTAIL_YES].join(" "),
  },
  {
    id: "barr:11-north-holiday-team",
    name: "11 North Holiday · Team",
    cat: "11 North",
    states: ELEVEN_NORTH_TEAM,
    payLow: null,
    payHigh: null,
    payText: "$0.97–$1.00 CPM to start (team: $0.97 or $1.00)",
    hometime: "Home every other weekend for 3 full days",
    notes: [HOLIDAY(3, "the Saturday after Black Friday"), TRUCK_HOME, BOBTAIL_YES, "Teams may bring 1 small dog."].join(" "),
  },
  {
    id: "barr:otr-18-solo",
    name: "OTR 18 · Solo",
    cat: "OTR 18",
    states: OTR18_SOLO,
    payLow: null,
    payHigh: null,
    payText: "Pay not in the sheet (OTR 18 Terminal solo starts at 73–78¢ a mile)",
    hometime: "Out 18 days, home 5 full days",
    notes: ["Hiring area: western NC and SC, northern GA, eastern TN, western IL and IN, IA and WI (the map also shades KY, WV, VA and parts of MI).", TRUCK_HOME, BOBTAIL_YES].join(" "),
  },
  {
    id: "barr:otr-18-terminal-solo",
    name: "OTR 18 Terminal · Solo",
    cat: "OTR 18",
    states: HIRING_AREA,
    ...soloPay(0.73, 0.78, MILES.otr),
    hometime: "Out 18 days, home 5 days (no extra time off for staying out longer)",
    notes: [
      TERMINALS,
      "CPM by experience (cap in brackets): 8–29 mo $0.73 ($0.78), 30+ mo $0.75 ($0.78); with hazmat 8–29 mo $0.76 ($0.80), 30+ mo $0.78 ($0.80).",
      "Plus 2¢ per paid mile for the year, paid as a lump sum in February 2027.",
      "Must work the 25 days from Black Friday to before Christmas.",
    ].join(" "),
  },
  {
    id: "barr:otr-18-team",
    name: "OTR 18 · Team",
    cat: "OTR 18",
    states: HIRING_AREA,
    payLow: null,
    payHigh: null,
    payText: "$0.95–$0.98 CPM to start (team: $0.95 or $0.98)",
    hometime: "Home every 18 days for 5 full days",
    notes: [TRUCK_HOME, BOBTAIL_YES, "Teams may bring 1 small dog."].join(" "),
  },
  {
    id: "barr:otr-18-terminal-team",
    name: "OTR 18 Terminal · Team",
    cat: "OTR 18",
    states: HIRING_AREA,
    // Team gross per driver: kept in the text only, so the map's weekly pay
    // compares solo offers.
    payLow: null,
    payHigh: null,
    payText: "$0.99–$1.02 CPM ($1.02 with hazmat), capped at start · $2,600–$3,300/wk gross per driver",
    hometime: "Out 18 days, home 5 days",
    notes: [
      "Drivers can live anywhere in the hiring area.",
      TERMINALS,
      "Runs mostly Northeast dedicated lanes, 4,400–5,000 miles a week, loaded one way and empty back.",
      "Plus 2¢ per paid mile for the year (split between the team), paid in February 2027.",
      "Must work the 25 days from the Saturday after Thanksgiving to before Christmas.",
    ].join(" "),
  },
  {
    id: "barr:18-north-holiday-team",
    name: "18 North Holiday · Team",
    cat: "OTR 18",
    states: HIRING_AREA,
    payLow: null,
    payHigh: null,
    payText: "$0.97–$1.00 CPM to start (team: $0.97 or $1.00)",
    hometime: "Home every 18 days for 5 full days",
    notes: [HOLIDAY(5, "the Saturday after Black Friday"), TRUCK_HOME, BOBTAIL_YES, "Teams may bring 1 small dog."].join(" "),
  },
  {
    id: "barr:otr-21-solo",
    name: "OTR 21 · Solo",
    cat: "OTR 21",
    states: OTR21_SOLO,
    payLow: null,
    payHigh: null,
    payText: "Pay not in the sheet",
    hometime: "Out 21 days, home 7 days plus 2 travel days",
    notes: [
      "Re-opened states: western IA, AZ, NM, CO, NE, OK, ND, SD, WY, MT, UT, ID, KS, MO.",
      "Leaves the truck at the PA or OH terminal and flies home and back (only from the closest major airport, not regional airports); sometimes a rental car if close. Must be willing to fly.",
      "No slip seating, it's their own truck. Truck comes with a CB, bedding and some utensils.",
    ].join(" "),
  },
  {
    id: "barr:otr-21-team",
    name: "OTR 21 · Team",
    cat: "OTR 21",
    states: OTR21_TEAM,
    payLow: null,
    payHigh: null,
    payText: "Pay not in the sheet",
    hometime: "Home every 21 days for 7 full days",
    notes: [
      "Flies home and back every 21 days, no truck at home. In the shaded part of Florida (around Jacksonville, Orlando and Tampa) teams with parking can take the truck home.",
      HOLIDAY(5, "the Saturday after Black Friday"),
      "Teams may bring 1 small dog.",
    ].join(" "),
  },
];

export const BARR_NUNN_ACCOUNTS: Omit<Account, "cities">[] = FLEETS.map((f) => ({
  ...f,
  carrier: "barr",
  approval: "",
  experience: "8 months+ (pay table starts at 8–29 months)",
  sob: "Transition bonus + $300 orientation pay on the 1st check",
}));

// Company-wide facts from the Misc Info, Orientation, Equipment and Pet
// Policy sheets, shown as the note above the map.
export const BARR_NUNN_NOTE = `<b>Barr-Nunn</b> pays per mile, so weekly pay is an <b>estimate</b>: starting CPM × average miles (Regional 1,900–2,200, OTR 2,000–2,400, Teams 4,000–5,500 a week). Hiring states come from each fleet's map picture in the sheet, so a state can be only partly covered: check the driver's address before quoting.
<br><b>Must know:</b> about 40% of loads run overnight (10pm–5am); a driver who can't drive at night isn't a fit. All trucks are automatic (auto restriction OK). Paid weekly on Fridays, on all miles, loaded and empty.
<br><b>Pay extras:</b> hazmat +3¢ solo / +4¢ team on hazmat loads · detention $15/hr after 1 hr · breakdown $100 first day, $160 each day after · extra stops $75 solo, $50 each team · layover $140 solo after 34 hrs, $75 each team after 17 hrs · no holiday pay.
<br><b>Bonuses:</b> CSA bonus with a paid day off every 90 days (solo $700, hazmat $875; team $825, hazmat $1,025) · on-road safety bonus $650 every 90 days · transition bonus on the 1st check ($2,450 up to $4,625 solo, $3,575 or $3,775 per team driver; OTR 11 fleets get the highest) · $300 orientation pay.
<br><b>Benefits:</b> health insurance from the 1st of the month after 60 days (weekly: single $66, family $179; dental $3.75–$10.50). Riders 10 years or older, 1 at a time. Teams only: 1 dog up to 40 lbs, at least 1 year old, $1,000 deposit ($500 back), taken out at $125 a week.
<br><b>Orientation:</b> starts Mondays in Columbus OH, Manchester PA (York) or Charlotte NC. Travel, a private hotel room and lunch are paid. <b>Terminals / drop yards:</b> Charlotte NC, Manchester PA, Columbus OH, Granger IA. <b>Trucks:</b> mostly 2022–2026 Freightliner Cascadias, 65 mph, fridge, TV, microwave, inverter, free Sirius XM. Freight is mostly e-commerce (Walmart, Home Depot).`;
