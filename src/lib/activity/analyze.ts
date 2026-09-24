import type { DriverRecord, DriverStatus } from "./types";

export interface StatusCounts {
  active: number;
  dq: number;
  hired: number;
  total: number;
}

function emptyCounts(): StatusCounts {
  return { active: 0, dq: 0, hired: 0, total: 0 };
}

function bump(counts: StatusCounts, status: DriverStatus) {
  counts.total += 1;
  if (status === "Active") counts.active += 1;
  else if (status === "DQ") counts.dq += 1;
  else if (status === "Hired") counts.hired += 1;
}

export function carrierTotals(records: DriverRecord[]): StatusCounts {
  const c = emptyCounts();
  records.forEach((r) => bump(c, r.status));
  return c;
}

// Hire rate over *decided* outcomes (hired vs DQ) — excludes still-active
// pipeline so an early snapshot with lots of pending drivers doesn't read as
// a low hire rate.
export function hireRate(counts: StatusCounts): number | null {
  const resolved = counts.hired + counts.dq;
  if (resolved === 0) return null;
  return counts.hired / resolved;
}

export interface BreakdownRow {
  key: string;
  counts: StatusCounts;
}

export function breakdownBy(
  records: DriverRecord[],
  keyFn: (r: DriverRecord) => string | undefined
): BreakdownRow[] {
  const map = new Map<string, StatusCounts>();
  records.forEach((r) => {
    const key = keyFn(r);
    if (!key) return;
    if (!map.has(key)) map.set(key, emptyCounts());
    bump(map.get(key)!, r.status);
  });
  return Array.from(map.entries())
    .map(([key, counts]) => ({ key, counts }))
    .sort((a, b) => b.counts.total - a.counts.total);
}

export function accountBreakdown(records: DriverRecord[]): BreakdownRow[] {
  return breakdownBy(records, (r) => r.account);
}

export function recruiterBreakdown(records: DriverRecord[]): BreakdownRow[] {
  return breakdownBy(records, (r) => r.recruiter);
}
