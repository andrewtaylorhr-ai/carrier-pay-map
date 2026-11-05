// Indeed's average weekly pay for "Truck driver" in each state (Pay Map
// "Indeed pay" view). Indeed has no separate Class A salary page; these
// state pages are built from its truck driver job postings (mostly CDL-A),
// past 36 months, base pay only. Source page per state:
// https://www.indeed.com/career/truck-driver/salaries/<ST>
// Snapshot taken Nov 2026 — refresh by hand when needed.
export const INDEED_PAY_AS_OF = "Nov 2026";
export const indeedSourceUrl = (st: string) => `https://www.indeed.com/career/truck-driver/salaries/${st}`;

// 2-letter state code -> average weekly pay ($)
export const INDEED_WEEKLY_PAY: Record<string, number> = {
  AL: 1579, AZ: 1564, AR: 1572, CA: 1519, CO: 1600, CT: 1740, DE: 1759, FL: 2348,
  GA: 1653, ID: 1564, IL: 1631, IN: 1560, IA: 1739, KS: 1666, KY: 1693, LA: 1599,
  ME: 2099, MD: 1728, MA: 1922, MI: 1658, MN: 1718, MS: 1618, MO: 1607, MT: 1797,
  NE: 1768, NV: 1633, NH: 1867, NJ: 1825, NM: 1563, NY: 1841, NC: 1751, ND: 1764,
  OH: 1680, OK: 1759, OR: 1664, PA: 1777, RI: 1690, SC: 1748, SD: 1850, TN: 1731,
  TX: 2000, UT: 1702, VT: 2877, VA: 1717, WA: 1677, WV: 1756, WI: 1673, WY: 1645,
};
