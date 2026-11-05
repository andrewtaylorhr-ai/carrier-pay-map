// Daily Tracker: per-recruiter daily submissions, weekly hires, monthly
// DQP / at-DQP counts and daily attendance — the team's tracking sheet,
// kept in the browser (localStorage) like the rest of the app.
import * as XLSX from "xlsx";

export type Attendance = "P" | "L" | "A" | "O"; // present, late, absent, off
export const ATTENDANCE_CYCLE: (Attendance | undefined)[] = [undefined, "P", "L", "A", "O"];
export const ATTENDANCE_LABEL: Record<Attendance, string> = { P: "Present", L: "Late", A: "Absent", O: "Off" };

export interface TrackerRow {
  sub?: Record<string, number>; // day of month -> submissions
  hire?: Record<string, number>; // week index -> hires
  dqp?: number;
  atDqp?: number;
  att?: Record<string, Attendance>; // day of month -> attendance
}

export interface TrackerData {
  groups: string[]; // ordered group names
  rowGroup: Record<string, string>; // recruiter -> group name
  groupColors?: Record<string, string>; // group name -> color picked by the user
  rowColors?: Record<string, string>; // recruiter -> color of their # cell
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

export function exportTrackerToExcel(ym: string, recruiters: string[], rows: Record<string, TrackerRow>) {
  const weeks = monthWeeks(ym);
  const subHead = ["Recruiter", "DQP", "at DQP", "Hire"];
  weeks.forEach((w) => {
    w.days.forEach((d) => subHead.push(dayLabel(ym, d)));
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
  const attHead = ["Recruiter", ...days.map((d) => dayLabel(ym, d)), "Present", "Late", "Absent", "Off", "Attendance %"];
  const attRows = recruiters.map((name) => {
    const r = rows[name];
    const c = attendanceCounts(r);
    return [name, ...days.map((d) => r?.att?.[d] ?? ""), c.P, c.L, c.A, c.O, c.rate];
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([subHead, ...subRows]);
  ws1["!cols"] = [{ wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Submissions & Hires");
  const ws2 = XLSX.utils.aoa_to_sheet([attHead, ...attRows]);
  ws2["!cols"] = [{ wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Attendance");
  XLSX.writeFile(wb, `Daily_Tracker_${monthLabel(ym).replace(/ /g, "_")}.xlsx`);
}
