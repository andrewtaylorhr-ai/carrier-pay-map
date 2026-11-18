"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { dayOf, driverStep, todayDay, type PipelineDriver } from "@/lib/pipeline";
import { dayLabel, dayOff, monthLabel, monthWeeks, shiftMonth, usHoliday, weekdayShort } from "@/lib/tracker";

// A driver counts as DQ'd once a note says so (DQ, denied) or their newest
// follow-up step is Declined / NQ, unless a later note says they were hired.
export const isDqd = (d: PipelineDriver) => !d.hired.length && (d.dq.length > 0 || driverStep(d) === "declined");

const NOT_MATCHED = "Not matched";

// The Driver Pipeline's submissions laid out like the Daily Tracker: one row
// per recruiter, one column per day. DQ'd submissions show in red.
export function PipelineGrid({
  drivers,
  recruiters,
  isActive,
  recruiterColor,
}: {
  drivers: PipelineDriver[];
  recruiters: string[];
  isActive: (name: string) => boolean;
  recruiterColor: (name: string) => string;
}) {
  const today = todayDay();
  const [ym, setYm] = useState(today.slice(0, 7));
  const [cell, setCell] = useState<{ name: string; day: number | null } | null>(null);
  const weeks = useMemo(() => monthWeeks(ym), [ym]);
  const todayN = today.startsWith(ym) ? Number(today.slice(8)) : null;

  // recruiter -> day -> drivers submitted that day
  const byDay = useMemo(() => {
    const m = new Map<string, Map<number, PipelineDriver[]>>();
    for (const d of drivers) {
      const day = dayOf(d.at);
      if (!day.startsWith(ym)) continue;
      const name = d.recruiter ?? NOT_MATCHED;
      const row = m.get(name) ?? new Map<number, PipelineDriver[]>();
      const n = Number(day.slice(8));
      row.set(n, [...(row.get(n) ?? []), d]);
      m.set(name, row);
    }
    return m;
  }, [drivers, ym]);

  // Active recruiters, plus anyone else with submissions this month.
  const rows = [...recruiters.filter((r) => isActive(r) || byDay.has(r)), ...(byDay.has(NOT_MATCHED) ? [NOT_MATCHED] : [])];
  const list = (name: string, days: number[]) => days.flatMap((d) => byDay.get(name)?.get(d) ?? []);
  const allDays = weeks.flatMap((w) => w.days);
  const dayClass = (d: number) => [dayOff(ym, d) ? "off" : "", d === todayN ? "today" : ""].filter(Boolean).join(" ") || undefined;

  // the total submitted in blue, then how many of them got DQ'd in red: "4 · 1"
  const counts = (ds: PipelineDriver[], color = "#60a5fa") => {
    const dq = ds.filter(isDqd).length;
    if (!ds.length) return "";
    return (
      <>
        <span style={{ color }}>{ds.length}</span>
        {dq > 0 && (
          <>
            <span className="text-[var(--cpm-text-faint)]"> · </span>
            <span className="text-[#ff6b6e]">{dq}</span>
          </>
        )}
      </>
    );
  };
  const tip = (ds: PipelineDriver[]) => ds.map((d) => `${d.name}${isDqd(d) ? " (DQ'd)" : ""}`).join("\n");
  const pick = (name: string, day: number | null, ds: PipelineDriver[]) =>
    ds.length && setCell(cell?.name === name && cell.day === day ? null : { name, day });
  const picked = cell ? list(cell.name, cell.day == null ? allDays : [cell.day]) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="monthNav">
          <button type="button" onClick={() => (setCell(null), setYm((m) => shiftMonth(m, -1)))} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span>{monthLabel(ym)}</span>
          <button type="button" onClick={() => (setCell(null), setYm((m) => shiftMonth(m, 1)))} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="text-[12px] text-[var(--cpm-text-dim)]">
          <span className="text-[#60a5fa] font-bold">Blue</span> = total submitted, <span className="text-[#ff6b6e] font-bold">red</span> = how many of them got
          DQ&apos;d (DQ, denied or declined / NQ). Click a number to see the drivers.
        </span>
      </div>

      <div className="trackerWrap">
        <table className="tracker">
          <thead>
            <tr>
              <th className="stick num">#</th>
              <th className="stick name">Recruiter</th>
              {weeks.map((w) => (
                <Fragment key={w.idx}>
                  {w.days.map((d) => (
                    <th key={d} className={dayClass(d)} title={dayOff(ym, d) ?? undefined}>
                      <span className="wkTag">{weekdayShort(ym, d)}</span>
                      {dayLabel(ym, d)}
                      {usHoliday(ym, d) && <span className="offTag">{usHoliday(ym, d)}</span>}
                    </th>
                  ))}
                  <th className="hSub">Submission</th>
                </Fragment>
              ))}
              <th className="hSub">Submission</th>
              <th className="hAbs">DQ&apos;d</th>
              <th className="hRate">DQ %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((name, i) => {
              const month = list(name, allDays);
              const dq = month.filter(isDqd).length;
              return (
                <tr key={name}>
                  <td className="stick num" style={{ background: name === NOT_MATCHED ? "#475569" : recruiterColor(name) }}>
                    {i + 1}
                  </td>
                  <td className="stick name">{name}</td>
                  {weeks.map((w) => {
                    const week = list(name, w.days);
                    return (
                      <Fragment key={w.idx}>
                        {w.days.map((d) => {
                          const ds = byDay.get(name)?.get(d) ?? [];
                          const on = cell?.name === name && cell.day === d;
                          return (
                            <td
                              key={d}
                              className={`${dayClass(d) ?? ""} font-bold${ds.length ? " cursor-pointer hover:brightness-150" : ""}`}
                              style={on ? { boxShadow: "inset 0 0 0 2px var(--cpm-accent)" } : undefined}
                              title={tip(ds) || undefined}
                              onClick={() => pick(name, d, ds)}
                            >
                              {counts(ds)}
                            </td>
                          );
                        })}
                        <td className="calc sub">{counts(week)}</td>
                      </Fragment>
                    );
                  })}
                  <td className="calc sub cursor-pointer" title={tip(month) || undefined} onClick={() => pick(name, null, month)}>
                    {month.length || ""}
                  </td>
                  <td className="calc text-[#ff6b6e]">{dq || ""}</td>
                  <td className="calc">{month.length ? `${Math.round((dq / month.length) * 100)}%` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="stick num" />
              <td className="stick name">TOTAL</td>
              {weeks.map((w) => (
                <Fragment key={w.idx}>
                  {w.days.map((d) => (
                    <td key={d}>{counts(rows.flatMap((r) => list(r, [d])), "#fff") || 0}</td>
                  ))}
                  <td>{counts(rows.flatMap((r) => list(r, w.days)), "#fff") || 0}</td>
                </Fragment>
              ))}
              <td>{rows.reduce((n, r) => n + list(r, allDays).length, 0)}</td>
              <td>{rows.reduce((n, r) => n + list(r, allDays).filter(isDqd).length, 0)}</td>
              <td>
                {(() => {
                  const all = rows.flatMap((r) => list(r, allDays));
                  return all.length ? `${Math.round((all.filter(isDqd).length / all.length) * 100)}%` : "—";
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {cell && picked.length > 0 && (
        <div className="rounded-[10px] border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
          <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-3">
            <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">
              {cell.name} · {cell.day == null ? monthLabel(ym) : `${weekdayShort(ym, cell.day)} ${dayLabel(ym, cell.day)}`} · {picked.length}
            </h3>
            <button type="button" className="ml-auto text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)]" onClick={() => setCell(null)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <ul className="divide-y divide-[var(--cpm-border)]">
            {picked.map((d) => {
              const last = [...d.followups, ...d.dqp, ...d.dq, ...d.hold, ...d.hired].sort((x, y) => x.at.localeCompare(y.at)).at(-1);
              return (
                <li key={d.key} className="px-4 py-2 flex items-start gap-3 text-[12.5px]">
                  <span className={`font-semibold min-w-[180px] ${isDqd(d) ? "text-[#ff6b6e]" : "text-[var(--cpm-text)]"}`}>{d.name}</span>
                  <span className="min-w-[90px] text-[var(--cpm-text-dim)]">{d.carrier || "—"}</span>
                  <span className={`min-w-[70px] font-semibold ${isDqd(d) ? "text-[#ff6b6e]" : d.hired.length ? "text-[#22c55e]" : "text-[#60a5fa]"}`}>
                    {isDqd(d) ? "DQ'd" : d.hired.length ? "Hired" : "Open"}
                  </span>
                  <span className="text-[var(--cpm-text-dim)] line-clamp-2">{last?.text || d.message || "—"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
