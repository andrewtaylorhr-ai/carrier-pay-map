// US time zones for the recruiter call plan (Strategy Builder map picture):
// each state's main zone, and helpers to turn "9 AM local" into a real
// instant so the plan can be shown in Eastern time and the recruiter's own
// time. Uses the browser's Intl time zone data, so daylight saving is right
// for the day the picture is made. States split across zones use the zone
// most of the state (and its big cities) is in.
import type { RecruiterTeam } from "./carriers/types";

export interface UsZone {
  key: string;
  label: string;
  tz: string; // IANA zone
  color: string;
}

const ZONES: Record<string, UsZone> = {
  ET: { key: "ET", label: "Eastern", tz: "America/New_York", color: "#60a5fa" },
  CT: { key: "CT", label: "Central", tz: "America/Chicago", color: "#34d399" },
  MT: { key: "MT", label: "Mountain", tz: "America/Denver", color: "#fbbf24" },
  AZ: { key: "AZ", label: "Arizona (no daylight saving)", tz: "America/Phoenix", color: "#f97316" },
  PT: { key: "PT", label: "Pacific", tz: "America/Los_Angeles", color: "#f472b6" },
  AK: { key: "AK", label: "Alaska", tz: "America/Anchorage", color: "#a78bfa" },
  HI: { key: "HI", label: "Hawaii", tz: "Pacific/Honolulu", color: "#22d3ee" },
};

const STATE_ZONE: Record<string, string> = {
  CT: "ET", DE: "ET", DC: "ET", FL: "ET", GA: "ET", IN: "ET", KY: "ET", ME: "ET", MD: "ET", MA: "ET", MI: "ET",
  NH: "ET", NJ: "ET", NY: "ET", NC: "ET", OH: "ET", PA: "ET", RI: "ET", SC: "ET", VT: "ET", VA: "ET", WV: "ET",
  AL: "CT", AR: "CT", IL: "CT", IA: "CT", KS: "CT", LA: "CT", MN: "CT", MS: "CT", MO: "CT", NE: "CT", ND: "CT",
  OK: "CT", SD: "CT", TN: "CT", TX: "CT", WI: "CT",
  CO: "MT", ID: "MT", MT: "MT", NM: "MT", UT: "MT", WY: "MT",
  AZ: "AZ",
  CA: "PT", NV: "PT", OR: "PT", WA: "PT",
  AK: "AK", HI: "HI",
};

export const zoneOfState = (code: string): UsZone | null => (STATE_ZONE[code] ? ZONES[STATE_ZONE[code]] : null);

export const TEAM_TZ: Record<RecruiterTeam, { tz: string; city: string }> = {
  uzbek: { tz: "Asia/Tashkent", city: "Tashkent" },
  philippines: { tz: "Asia/Manila", city: "Manila" },
};

// minutes `tz` is ahead of UTC at `at`
function offsetMinutes(tz: string, at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - at.getTime()) / 60000);
}

// the instant it is `hour`:00 today in `tz`
export function localHourToday(tz: string, hour: number, now = new Date()): number {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  const guess = Date.UTC(ymd[0], ymd[1] - 1, ymd[2], hour);
  return guess - offsetMinutes(tz, new Date(guess)) * 60000;
}

// "9 AM", "7:30 PM" in `tz`
export function clock(ms: number, tz: string): string {
  return new Date(ms).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).replace(":00", "");
}

// "EST"/"EDT"-style short name, falling back to the zone's own label
export function shortZoneName(tz: string, at = new Date()): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? tz;
}
