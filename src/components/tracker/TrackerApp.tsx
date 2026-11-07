"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Download, Send, X } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { NEW_RECRUITER_COLOR, todayISO } from "@/lib/trainees";
import {
  ATTENDANCE_CYCLE,
  ATTENDANCE_LABEL,
  EMPTY_TRACKER,
  appToHire,
  attendanceCounts,
  dayLabel,
  exportTrackerToExcel,
  isSunday,
  monthLabel,
  monthWeeks,
  shiftMonth,
  totalHires,
  totalSubs,
  weekSubs,
  type Attendance,
  type TrackerData,
  type TrackerRow,
} from "@/lib/tracker";

const DEFAULT_ROW_COLOR = "#475569";
const FORMER_ROW_COLOR = "#e5484d";
const PALETTE = ["#7c2d4f", "#a8577e", "#dc2626", "#ea8a0c", "#eab308", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#475569"];

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function TrackerApp() {
  const { recruiters, getRecruiterStatus, showFormer, setShowFormer, trainees, isNewRecruiter, updateTrainee } = useCarrierMap();
  const [data, setData] = useLocalStorageState<TrackerData>("cdlPayMapTracker", EMPTY_TRACKER);
  const [ym, setYm] = useState(thisMonth);
  const [tab, setTab] = useState<"subs" | "att">("subs");
  // rows picked by clicking their # cell (shift = range, ctrl = add/remove one)
  const [picked, setPicked] = useState<string[]>([]);
  const anchor = useRef<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => monthWeeks(ym), [ym]);
  const days = weeks.flatMap((w) => w.days);
  const rows = data.months[ym] || {};
  const now = new Date();
  const today = ym === thisMonth() ? now.getDate() : null;

  // Active recruiters, plus (when "Show former" is on, shared with Team
  // Overview) anyone inactive who already has numbers this month.
  // In the order the user dragged them; anyone new goes to the bottom in roster order.
  // Former recruiters always sit below everyone active, shown in red.
  const isFormer = (r: string) => (getRecruiterStatus(r) === "inactive" ? 1 : 0);
  const isNew = (r: string) => !isFormer(r) && isNewRecruiter(r);
  // A new recruiter stops being "new" the first time a hire is entered for them.
  useEffect(() => {
    for (const [n, t] of Object.entries(trainees)) {
      if (t.stage !== "approved" || t.firstHireAt) continue;
      if (Object.values(data.months).some((m) => totalHires(m[n]) > 0)) updateTrainee(n, { firstHireAt: todayISO() });
    }
  }, [trainees, data.months, updateTrainee]);
  const pos = (r: string) => {
    const i = data.rowOrder?.indexOf(r) ?? -1;
    return i < 0 ? Infinity : i;
  };
  const ordered = recruiters
    .filter((r) => getRecruiterStatus(r) === "active" || (showFormer && rows[r]))
    .map((r, i) => ({ r, i }))
    .sort((a, b) => isFormer(a.r) - isFormer(b.r) || pos(a.r) - pos(b.r) || a.i - b.i)
    .map((x) => x.r);
  const formerWithData = recruiters.filter((r) => getRecruiterStatus(r) === "inactive" && rows[r]).length;
  const [dragging, setDragging] = useState<string[] | null>(null);
  const [dropAt, setDropAt] = useState<{ name: string; after: boolean } | null>(null);
  const rowColor = (r: string) => (isFormer(r) ? FORMER_ROW_COLOR : isNew(r) ? NEW_RECRUITER_COLOR : data.rowColors?.[r] ?? DEFAULT_ROW_COLOR);
  // numbering starts again at 1 wherever the row color changes (one block per team color)
  const blockNo = ordered.reduce<number[]>((acc, r, i) => {
    acc.push(i > 0 && rowColor(r) === rowColor(ordered[i - 1]) ? acc[i - 1] + 1 : 1);
    return acc;
  }, []);

  const updateRow = (name: string, fn: (r: TrackerRow) => TrackerRow) =>
    setData((d) => {
      const month = d.months[ym] || {};
      return { ...d, months: { ...d.months, [ym]: { ...month, [name]: fn(month[name] || {}) } } };
    });
  const setIn = (name: string, field: "sub" | "hire", key: number, v: number | null) =>
    updateRow(name, (r) => {
      const next = { ...(r[field] || {}) };
      if (v == null) delete next[key];
      else next[key] = v;
      return { ...r, [field]: next };
    });
  const setAtt = (name: string, day: number, a: Attendance | undefined) =>
    updateRow(name, (r) => {
      const att = { ...(r.att || {}) };
      if (a) att[day] = a;
      else delete att[day];
      return { ...r, att };
    });

  // Enter / arrow keys move between cells like a spreadsheet.
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    const caretAtEnd = el.selectionStart === el.value.length;
    const caretAtStart = el.selectionStart === 0;
    let to: [number, number] | null = null;
    if (e.key === "Enter" || e.key === "ArrowDown") to = [r + (e.shiftKey && e.key === "Enter" ? -1 : 1), c];
    else if (e.key === "ArrowUp") to = [r - 1, c];
    else if (e.key === "ArrowRight" && caretAtEnd) to = [r, c + 1];
    else if (e.key === "ArrowLeft" && caretAtStart) to = [r, c - 1];
    if (!to) return;
    const next = tableRef.current?.querySelector<HTMLInputElement>(`input[data-r="${to[0]}"][data-c="${to[1]}"]`);
    if (next) {
      e.preventDefault();
      next.focus();
      next.select();
    }
  };

  const num = (name: string, value: number | undefined, set: (v: number | null) => void, r: number, c: number, cls = "") => (
    <input
      className={`tCell ${cls}`}
      inputMode="numeric"
      data-r={r}
      data-c={c}
      value={value ? String(value) : ""}
      onKeyDown={onKey}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9]/g, "");
        set(t === "" ? null : Number(t));
      }}
      aria-label={name}
    />
  );

  // column totals
  const colSum = (fn: (r: TrackerRow | undefined) => number) => ordered.reduce((n, name) => n + fn(rows[name]), 0);
  const grandSubs = colSum(totalSubs);
  const grandHires = colSum(totalHires);

  const pick = (name: string, e: MouseEvent) => {
    if (e.shiftKey && anchor.current && ordered.includes(anchor.current)) {
      const [a, b] = [ordered.indexOf(anchor.current), ordered.indexOf(name)].sort((x, y) => x - y);
      setPicked(ordered.slice(a, b + 1));
      return;
    }
    anchor.current = name;
    if (e.ctrlKey || e.metaKey) setPicked((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
    else setPicked((cur) => (cur.length === 1 && cur[0] === name ? [] : [name]));
  };
  const colorPicked = (color: string | null) =>
    setData((d) => {
      const rowColors = { ...(d.rowColors || {}) };
      picked.forEach((r) => {
        if (color) rowColors[r] = color;
        else delete rowColors[r];
      });
      return { ...d, rowColors };
    });
  // Drag a row by its # cell (all selected rows move together if it is one of them).
  const rowDnD = (name: string) => ({
    onDragOver: (e: DragEvent<HTMLTableRowElement>) => {
      if (!dragging) return;
      e.preventDefault();
      const box = e.currentTarget.getBoundingClientRect();
      const after = e.clientY > box.top + box.height / 2;
      if (dropAt?.name !== name || dropAt.after !== after) setDropAt({ name, after });
    },
    onDrop: (e: DragEvent<HTMLTableRowElement>) => {
      e.preventDefault();
      if (dragging && dropAt && !dragging.includes(dropAt.name)) {
        const rest = ordered.filter((r) => !dragging.includes(r));
        const at = rest.indexOf(dropAt.name) + (dropAt.after ? 1 : 0);
        const moved = ordered.filter((r) => dragging.includes(r));
        setData((d) => ({ ...d, rowOrder: [...rest.slice(0, at), ...moved, ...rest.slice(at)] }));
      }
      setDragging(null);
      setDropAt(null);
    },
    className: [
      isFormer(name) ? "formerRow" : "",
      isNew(name) ? "newRow" : "",
      dragging?.includes(name) ? "dragSrc" : "",
      dropAt?.name === name ? (dropAt.after ? "dropBelow" : "dropAbove") : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined,
  });

  const numCell = (name: string, i: number) => (
    <td
      className={`stick num pickable${picked.includes(name) ? " picked" : ""}`}
      style={{ background: rowColor(name) }}
      onClick={(e) => pick(name, e)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", name);
        setDragging(picked.includes(name) ? picked : [name]);
      }}
      onDragEnd={() => {
        setDragging(null);
        setDropAt(null);
      }}
      title="Click to select for coloring (Shift = range, Ctrl = add) · drag to move the row"
    >
      {blockNo[i]}
    </td>
  );

  const markAllPresentToday = () => {
    if (!today) return;
    ordered.forEach((name) => {
      if (!rows[name]?.att?.[today]) setAtt(name, today, "P");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="monthNav">
          <button type="button" onClick={() => setYm((m) => shiftMonth(m, -1))} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span>{monthLabel(ym)}</span>
          <button type="button" onClick={() => setYm((m) => shiftMonth(m, 1))} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="segTabs">
          <button type="button" className={tab === "subs" ? "active" : undefined} onClick={() => setTab("subs")}>
            <Send size={14} /> Submissions & Hires
          </button>
          <button type="button" className={tab === "att" ? "active" : undefined} onClick={() => setTab("att")}>
            <CalendarCheck size={14} /> Attendance
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {formerWithData > 0 && (
            <button type="button" className="ghostBtn" onClick={() => setShowFormer(!showFormer)}>
              {showFormer ? "Hide former recruiters" : `Show former recruiters (${formerWithData})`}
            </button>
          )}
          {tab === "att" && today && (
            <button type="button" className="ghostBtn" onClick={markAllPresentToday}>
              Mark everyone present today
            </button>
          )}
          <button type="button" className="primaryBtn" onClick={() => exportTrackerToExcel(ym, ordered, rows)}>
            <Download size={14} /> Download Excel
          </button>
        </div>
      </div>

      {picked.length > 0 && (
        <div className="colorBar">
          <b>
            {picked.length} row{picked.length === 1 ? "" : "s"} selected
          </b>
          <span className="text-[var(--cpm-text-faint)]">Color:</span>
          {PALETTE.map((c) => (
            <button key={c} type="button" className="paletteDot" style={{ background: c }} onClick={() => colorPicked(c)} aria-label={`Color ${c}`} />
          ))}
          <label className="colorSwatch" title="Any color" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
            <input type="color" value={rowColor(picked[0])} onChange={(e) => colorPicked(e.target.value)} aria-label="Pick any color" />
          </label>
          <button type="button" className="ghostBtn" onClick={() => colorPicked(null)}>
            Reset
          </button>
          <button type="button" className="ghostBtn ml-auto" onClick={() => setPicked([])}>
            <X size={14} /> Done
          </button>
        </div>
      )}

      {!ordered.length ? (
        <div className="py-10 text-center text-[14px] text-[var(--cpm-text-dim)]">
          No recruiters yet — add them in <b>Team Overview</b>.
        </div>
      ) : (
        <div className="trackerWrap" ref={tableRef}>
          {tab === "subs" ? (
            <table className="tracker">
              <thead>
                <tr>
                  <th className="stick num">#</th>
                  <th className="stick name">Recruiter</th>
                  <th className="stick c1 hDqp">DQP</th>
                  <th className="stick c2 hAtDqp">at DQP</th>
                  <th className="stick c3 hHire">Hire</th>
                  {weeks.map((w) => (
                    <Fragment key={w.idx}>
                      {w.days.map((d) => (
                        <th key={d} className={`${isSunday(ym, d) ? "sun" : ""}${d === today ? " today" : ""}`}>
                          {dayLabel(ym, d)}
                        </th>
                      ))}
                      <th className="hSub">Submission</th>
                      <th className="hHire">Hire</th>
                    </Fragment>
                  ))}
                  <th className="hSub">Submission</th>
                  <th className="hRate">App-to-Hire %</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((name, ri) => {
                    const r = rows[name];
                      let c = 0;
                      return (
                        <tr key={name} {...rowDnD(name)}>
                          {numCell(name, ri)}
                          <td className="stick name">
                            {name}
                            {isFormer(name) ? <span className="formerTag">Former</span> : null}
                            {isNew(name) ? <span className="newTag">New</span> : null}
                          </td>
                          <td className="stick c1">{num(`${name} DQP`, r?.dqp, (v) => updateRow(name, (x) => ({ ...x, dqp: v ?? undefined })), ri, c++)}</td>
                          <td className="stick c2">{num(`${name} at DQP`, r?.atDqp, (v) => updateRow(name, (x) => ({ ...x, atDqp: v ?? undefined })), ri, c++)}</td>
                          <td className="stick c3 calc hire">{totalHires(r)}</td>
                          {weeks.map((w) => (
                            <Fragment key={w.idx}>
                              {w.days.map((d) => (
                                <td key={d} className={`${isSunday(ym, d) ? "sun" : ""}${d === today ? " today" : ""}`}>
                                  {num(`${name} ${dayLabel(ym, d)}`, r?.sub?.[d], (v) => setIn(name, "sub", d, v), ri, c++)}
                                </td>
                              ))}
                              <td className="calc sub">{weekSubs(r, w) || ""}</td>
                              <td className="hireIn">{num(`${name} week ${w.idx + 1} hires`, r?.hire?.[w.idx], (v) => setIn(name, "hire", w.idx, v), ri, c++)}</td>
                            </Fragment>
                          ))}
                          <td className="calc sub">{totalSubs(r)}</td>
                          <td className="calc">{appToHire(totalSubs(r), totalHires(r))}</td>
                        </tr>
                      );
                    })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="stick num" />
                  <td className="stick name">TOTAL</td>
                  <td className="stick c1">{colSum((r) => r?.dqp ?? 0)}</td>
                  <td className="stick c2">{colSum((r) => r?.atDqp ?? 0)}</td>
                  <td className="stick c3">{grandHires}</td>
                  {weeks.map((w) => (
                    <Fragment key={w.idx}>
                      {w.days.map((d) => (
                        <td key={d}>{colSum((r) => r?.sub?.[d] ?? 0)}</td>
                      ))}
                      <td>{colSum((r) => weekSubs(r, w))}</td>
                      <td>{colSum((r) => r?.hire?.[w.idx] ?? 0)}</td>
                    </Fragment>
                  ))}
                  <td>{grandSubs}</td>
                  <td>{appToHire(grandSubs, grandHires)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="tracker att">
              <thead>
                <tr>
                  <th className="stick num">#</th>
                  <th className="stick name">Recruiter</th>
                  {days.map((d) => (
                    <th key={d} className={`${isSunday(ym, d) ? "sun" : ""}${d === today ? " today" : ""}`}>
                      {dayLabel(ym, d)}
                    </th>
                  ))}
                  <th className="hHire">Present</th>
                  <th className="hAtDqp">Late</th>
                  <th className="hAbs">Absent</th>
                  <th>Off</th>
                  <th className="hRate">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((name, ri) => {
                    const r = rows[name];
                      const c = attendanceCounts(r);
                      return (
                        <tr key={name} {...rowDnD(name)}>
                          {numCell(name, ri)}
                          <td className="stick name">
                            {name}
                            {isFormer(name) ? <span className="formerTag">Former</span> : null}
                            {isNew(name) ? <span className="newTag">New</span> : null}
                          </td>
                          {days.map((d) => {
                            const a = r?.att?.[d];
                            const step = (dir: number) => {
                              const at = ATTENDANCE_CYCLE.indexOf(a);
                              const n = ATTENDANCE_CYCLE.length;
                              setAtt(name, d, ATTENDANCE_CYCLE[(at + dir + n) % n]);
                            };
                            return (
                              <td key={d} className={`${isSunday(ym, d) ? "sun" : ""}${d === today ? " today" : ""}`}>
                                <button
                                  type="button"
                                  className={`attCell${a ? " a" + a : ""}`}
                                  onClick={(e) => step(e.shiftKey ? -1 : 1)}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setAtt(name, d, undefined);
                                  }}
                                  title={`${name}, ${dayLabel(ym, d)}: ${a ? ATTENDANCE_LABEL[a] : "not marked"} — click to change, right-click to clear`}
                                >
                                  {a ?? ""}
                                </button>
                              </td>
                            );
                          })}
                          <td className="calc">{c.P}</td>
                          <td className="calc">{c.L}</td>
                          <td className="calc">{c.A}</td>
                          <td className="calc">{c.O}</td>
                          <td className="calc">{c.rate}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="text-[11.5px] text-[var(--cpm-text-faint)]">
        {tab === "subs" ? (
          <>
            Type submissions per day and hires per week — weekly and monthly totals, the TOTAL row and App-to-Hire % fill
            in by themselves. Enter / arrow keys move between cells. Click a # to color rows; drag a # up or down to move the row. Saved in this browser.
          </>
        ) : (
          <>
            Click a day to cycle{" "}
            {(["P", "L", "A", "O"] as Attendance[]).map((a) => (
              <span key={a} className={`attCell a${a} legend`}>
                {a}
              </span>
            ))}{" "}
            (Present, Late, Absent, Off). Shift-click goes back, right-click clears. Attendance % = (present + late) ÷ days
            worked or missed.
          </>
        )}
      </div>
    </div>
  );
}
