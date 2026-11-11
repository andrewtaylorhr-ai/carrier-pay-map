// Daily Tracker: per-recruiter daily submissions, weekly hires, monthly
// DQP / at-DQP counts and daily attendance — the team's tracking sheet,
// kept in the browser (localStorage) like the rest of the app.
import * as XLSX from "xlsx";

export type Attendance = "P" | "L" | "A" | "O"; // present, late, absent, off
export const ATTENDANCE_CYCLE: (Attendance | undefined)[] = [undefined, "P", "L", "A", "O"];
export const ATTENDANCE_LABEL: Record<Attendance, string> = { P: "Present", L: "Late", A: "Absent", O: "Off" };

// A driver hired in a week: who, for which company and on what day. Only
// these three, never SSNs, phones or license numbers.
export interface HireNote {
  driver: string;
  company: string;
  kind?: "Trainee" | "Exp"; // Swift only: hired as a student (trainee) or experienced
  day: number; // day of month
}

export interface TrackerRow {
  sub?: Record<string, number>; // day of month -> submissions
  hire?: Record<string, number>; // week index -> hires
  hireNotes?: Record<string, HireNote[]>; // week index -> the drivers hired (their count is the week's hires)
  dqp?: number;
  atDqp?: number;
  att?: Record<string, Attendance>; // day of month -> attendance
}

export interface TrackerData {
  groups: string[]; // ordered group names
  rowGroup: Record<string, string>; // recruiter -> group name
  groupColors?: Record<string, string>; // group name -> color picked by the user
  rowColors?: Record<string, string>; // recruiter -> color of their # cell
  rowOrder?: string[]; // recruiters top to bottom, as dragged by the user
  months: Record<string, Record<string, TrackerRow>>; // "YYYY-MM" -> recruiter -> row
}

export const EMPTY_TRACKER: TrackerData = { groups: ["Team 1", "Team 2", "Team 3"], rowGroup: {}, months: {} };

export interface Week {
  idx: number;
  days: number[];
}

// Sunday-to-Saturday weeks, clipped to the month.
export function monthWeeks(ym: string): Week[] {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const weeks: Week[] = [];
  let cur: number[] = [];
  for (let d = 1; d <= last; d++) {
    cur.push(d);
    if (new Date(y, m - 1, d).getDay() === 6 || d === last) {
      weeks.push({ idx: weeks.length, days: cur });
      cur = [];
    }
  }
  return weeks;
}

export const isSunday = (ym: string, day: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, day).getDay() === 0;
};

// US federal holidays on their calendar date (not the weekday they're observed on).
function nthWeekday(y: number, m: number, weekday: number, n: number) {
  const first = new Date(y, m - 1, 1).getDay();
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}
function lastWeekday(y: number, m: number, weekday: number) {
  const last = new Date(y, m, 0);
  return last.getDate() - ((last.getDay() - weekday + 7) % 7);
}
export function usHoliday(ym: string, day: number): string | null {
  const [y, m] = ym.split("-").map(Number);
  const list: [number, number, string][] = [
    [1, 1, "New Year's Day"],
    [1, nthWeekday(y, 1, 1, 3), "MLK Day"],
    [2, nthWeekday(y, 2, 1, 3), "Presidents' Day"],
    [5, lastWeekday(y, 5, 1), "Memorial Day"],
    [6, 19, "Juneteenth"],
    [7, 4, "Independence Day"],
    [9, nthWeekday(y, 9, 1, 1), "Labor Day"],
    [10, nthWeekday(y, 10, 1, 2), "Columbus Day"],
    [11, 11, "Veterans Day"],
    [11, nthWeekday(y, 11, 4, 4), "Thanksgiving"],
    [12, 25, "Christmas Day"],
  ];
  return list.find(([hm, hd]) => hm === m && hd === day)?.[2] ?? null;
}

export const weekdayShort = (ym: string, day: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleString("en-US", { weekday: "short" });
};

// Sundays and US holidays are days off: the holiday's name, "Sunday", or null.
export const dayOff = (ym: string, day: number) => usHoliday(ym, day) ?? (isSunday(ym, day) ? "Sunday" : null);

export const dayLabel = (ym: string, day: number) => {
  const [y, m] = ym.split("-").map(Number);
  return `${day} ${new Date(y, m - 1, day).toLocaleString("en-US", { month: "short" })}`;
};

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

export const shiftMonth = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const sum = (o?: Record<string, number>) => Object.values(o || {}).reduce((a, b) => a + b, 0);

export const weekSubs = (r: TrackerRow | undefined, w: Week) => w.days.reduce((n, d) => n + (r?.sub?.[d] ?? 0), 0);
export const totalSubs = (r?: TrackerRow) => sum(r?.sub);
export const totalHires = (r?: TrackerRow) => sum(r?.hire);
export const appToHire = (subs: number, hires: number) => (subs ? `${((hires / subs) * 100).toFixed(1)}%` : "—");

export function attendanceCounts(r?: TrackerRow) {
  const c: Record<Attendance, number> = { P: 0, L: 0, A: 0, O: 0 };
  Object.values(r?.att || {}).forEach((a) => c[a]++);
  const worked = c.P + c.L + c.A;
  return { ...c, rate: worked ? `${Math.round(((c.P + c.L) / worked) * 100)}%` : "—" };
}

const headLabel = (ym: string, d: number) => {
  const holiday = usHoliday(ym, d);
  return `${dayLabel(ym, d)} ${weekdayShort(ym, d)}${holiday ? ` (${holiday})` : ""}`;
};

export function exportTrackerToExcel(ym: string, recruiters: string[], rows: Record<string, TrackerRow>) {
  const weeks = monthWeeks(ym);
  const subHead = ["Recruiter", "DQP", "at DQP", "Hire"];
  weeks.forEach((w) => {
    w.days.forEach((d) => subHead.push(headLabel(ym, d)));
    subHead.push(`Week ${w.idx + 1} Submission`, `Week ${w.idx + 1} Hire`);
  });
  subHead.push("Submission", "App-to-Hire %");
  const subRows = recruiters.map((name) => {
    const r = rows[name];
    const line: (string | number)[] = [name, r?.dqp ?? 0, r?.atDqp ?? 0, totalHires(r)];
    weeks.forEach((w) => {
      w.days.forEach((d) => line.push(r?.sub?.[d] ?? ""));
      line.push(weekSubs(r, w), r?.hire?.[w.idx] ?? 0);
    });
    line.push(totalSubs(r), appToHire(totalSubs(r), totalHires(r)));
    return line;
  });

  const days = weeks.flatMap((w) => w.days);
  const attHead = ["Recruiter", ...days.map((d) => headLabel(ym, d)), "Present", "Late", "Absent", "Off", "Attendance %"];
  const attRows = recruiters.map((name) => {
    const r = rows[name];
    const c = attendanceCounts(r);
    return [name, ...days.map((d) => r?.att?.[d] ?? ""), c.P, c.L, c.A, c.O, c.rate];
  });

  const hireHead = ["Recruiter", "Driver", "Company", "Trainee / Exp", "Hire date"];
  const hireRows = recruiters.flatMap((name) =>
    weeks.flatMap((w) => (rows[name]?.hireNotes?.[w.idx] ?? []).map((n) => [name, n.driver, n.company, n.kind ?? "", dayLabel(ym, n.day)]))
  );

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([subHead, ...subRows]);
  ws1["!cols"] = [{ wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Submissions & Hires");
  const ws2 = XLSX.utils.aoa_to_sheet([attHead, ...attRows]);
  ws2["!cols"] = [{ wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Attendance");
  const ws3 = XLSX.utils.aoa_to_sheet([hireHead, ...hireRows]);
  ws3["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 13 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Hires");
  XLSX.writeFile(wb, `Daily_Tracker_${monthLabel(ym).replace(/ /g, "_")}.xlsx`);
}
