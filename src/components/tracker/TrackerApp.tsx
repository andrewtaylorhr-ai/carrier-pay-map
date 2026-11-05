"use client";

import { Fragment, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Download, Plus, Send, Users, X } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
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

const GROUP_COLORS = ["#7c2d4f", "#a8577e", "#16a34a", "#ea8a0c", "#2563eb", "#7c3aed", "#0891b2"];
const OTHER = "Other";
// the user's pick, else a default by position (Other is always last)
const colorOf = (data: TrackerData, name: string) => {
  const i = name === OTHER ? data.groups.length : data.groups.indexOf(name);
  return data.groupColors?.[name] ?? GROUP_COLORS[Math.max(0, i) % GROUP_COLORS.length];
};

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function TrackerApp() {
  const { recruiters, getRecruiterStatus, addRecruiter } = useCarrierMap();
  const [data, setData] = useLocalStorageState<TrackerData>("cdlPayMapTracker", EMPTY_TRACKER);
  const [ym, setYm] = useState(thisMonth);
  const [tab, setTab] = useState<"subs" | "att">("subs");
  const [manage, setManage] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => monthWeeks(ym), [ym]);
  const days = weeks.flatMap((w) => w.days);
  const rows = data.months[ym] || {};
  const now = new Date();
  const today = ym === thisMonth() ? now.getDate() : null;

  // Active recruiters, plus anyone inactive who already has numbers this month.
  const shown = recruiters.filter((r) => getRecruiterStatus(r) === "active" || rows[r]);
  const groupOf = (r: string) => (data.groups.includes(data.rowGroup[r]) ? data.rowGroup[r] : OTHER);
  const groups = [...data.groups, OTHER]
    .map((g) => ({ name: g, color: colorOf(data, g), members: shown.filter((r) => groupOf(r) === g) }))
    .filter((g) => g.members.length);
  const ordered = groups.flatMap((g) => g.members);

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

  const setGroupColor = (name: string, color: string) =>
    setData((d) => ({ ...d, groupColors: { ...(d.groupColors || {}), [name]: color } }));

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
          {tab === "att" && today && (
            <button type="button" className="ghostBtn" onClick={markAllPresentToday}>
              Mark everyone present today
            </button>
          )}
          <button type="button" className="ghostBtn" onClick={() => setManage((v) => !v)}>
            <Users size={14} /> Rows & groups
          </button>
          <button type="button" className="primaryBtn" onClick={() => exportTrackerToExcel(ym, ordered, rows)}>
            <Download size={14} /> Download Excel
          </button>
        </div>
      </div>

      {manage && <ManageGroups data={data} setData={setData} setGroupColor={setGroupColor} shown={shown} groupOf={groupOf} addRecruiter={addRecruiter} onClose={() => setManage(false)} />}

      {!ordered.length ? (
        <div className="py-10 text-center text-[14px] text-[var(--cpm-text-dim)]">
          No recruiters yet — add them under <b>Rows & groups</b>.
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
                {groups.map((g) => (
                  <Fragment key={g.name}>
                    <tr className="groupRow">
                      <td className="stick num" style={{ background: g.color }}>
                        <ColorPick value={g.color} onChange={(c) => setGroupColor(g.name, c)} label={g.name} />
                      </td>
                      <td className="stick name" style={{ borderLeft: `3px solid ${g.color}` }}>
                        {g.name}
                      </td>
                      <td className="stick c1" />
                      <td className="stick c2" />
                      <td className="stick c3" />
                      <td colSpan={days.length + weeks.length * 2 + 2} />
                    </tr>
                    {g.members.map((name, i) => {
                      const r = rows[name];
                      const ri = ordered.indexOf(name);
                      let c = 0;
                      return (
                        <tr key={name}>
                          <td className="stick num" style={{ background: g.color }}>
                            {i + 1}
                          </td>
                          <td className="stick name">{name}</td>
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
                  </Fragment>
                ))}
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
                {groups.map((g) => (
                  <Fragment key={g.name}>
                    <tr className="groupRow">
                      <td className="stick num" style={{ background: g.color }}>
                        <ColorPick value={g.color} onChange={(c) => setGroupColor(g.name, c)} label={g.name} />
                      </td>
                      <td className="stick name" style={{ borderLeft: `3px solid ${g.color}` }}>
                        {g.name}
                      </td>
                      <td colSpan={days.length + 5} />
                    </tr>
                    {g.members.map((name, i) => {
                      const r = rows[name];
                      const c = attendanceCounts(r);
                      return (
                        <tr key={name}>
                          <td className="stick num" style={{ background: g.color }}>
                            {i + 1}
                          </td>
                          <td className="stick name">{name}</td>
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="text-[11.5px] text-[var(--cpm-text-faint)]">
        {tab === "subs" ? (
          <>
            Type submissions per day and hires per week — weekly and monthly totals, the TOTAL row and App-to-Hire % fill
            in by themselves. Enter / arrow keys move between cells. Saved in this browser.
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

function ManageGroups({
  data,
  setData,
  setGroupColor,
  shown,
  groupOf,
  addRecruiter,
  onClose,
}: {
  data: TrackerData;
  setData: (fn: (d: TrackerData) => TrackerData) => void;
  setGroupColor: (name: string, color: string) => void;
  shown: string[];
  groupOf: (r: string) => string;
  addRecruiter: (name: string) => string | null;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const renameGroup = (i: number, name: string) =>
    setData((d) => {
      const old = d.groups[i];
      const groups = d.groups.slice();
      groups[i] = name;
      const rowGroup = Object.fromEntries(Object.entries(d.rowGroup).map(([r, g]) => [r, g === old ? name : g]));
      const groupColors = { ...(d.groupColors || {}) };
      if (old in groupColors) {
        groupColors[name] = groupColors[old];
        delete groupColors[old];
      }
      return { ...d, groups, rowGroup, groupColors };
    });
  const removeGroup = (i: number) => setData((d) => ({ ...d, groups: d.groups.filter((_, j) => j !== i) }));
  const addGroup = () =>
    setData((d) => {
      let n = d.groups.length + 1;
      while (d.groups.includes(`Team ${n}`)) n++;
      return { ...d, groups: [...d.groups, `Team ${n}`] };
    });
  const setGroup = (r: string, g: string) => setData((d) => ({ ...d, rowGroup: { ...d.rowGroup, [r]: g } }));

  return (
    <div className="trackerManage">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold text-[var(--cpm-text)]">Rows & groups</div>
        <button type="button" className="ghostBtn" onClick={onClose}>
          <X size={14} /> Close
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="tmLabel">Groups (top to bottom)</div>
          <div className="flex flex-col gap-1.5">
            {data.groups.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <ColorPick value={colorOf(data, g)} onChange={(c) => setGroupColor(g, c)} label={g} swatch />
                <input className="tmInput flex-1" value={g} onChange={(e) => renameGroup(i, e.target.value)} />
                <button type="button" className="iconBtn" onClick={() => removeGroup(i)} title="Remove group (its recruiters move to Other)">
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <ColorPick value={colorOf(data, OTHER)} onChange={(c) => setGroupColor(OTHER, c)} label={OTHER} swatch />
              <span className="text-[13px] text-[var(--cpm-text-dim)] px-[9px]">Other (anyone not in a group)</span>
            </div>
            <button type="button" className="ghostBtn self-start" onClick={addGroup}>
              <Plus size={14} /> Add group
            </button>
          </div>
          <div className="tmLabel mt-4">Add a recruiter</div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const msg = addRecruiter(newName.trim());
              setErr(msg);
              if (!msg) setNewName("");
            }}
          >
            <input className="tmInput flex-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Recruiter name" />
            <button type="submit" className="primaryBtn" disabled={!newName.trim()}>
              <Plus size={14} /> Add
            </button>
          </form>
          {err && <div className="text-[12px] text-[var(--cpm-red)] mt-1">{err}</div>}
        </div>
        <div>
          <div className="tmLabel">Which group is each recruiter in?</div>
          <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto pr-1">
            {shown.map((r) => (
              <div key={r} className="flex items-center gap-2 text-[13px]">
                <span className="flex-1 truncate text-[var(--cpm-text)]">{r}</span>
                <select className="tmInput w-[150px]" value={groupOf(r)} onChange={(e) => setGroup(r, e.target.value)}>
                  {[...data.groups, OTHER].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-[var(--cpm-text-faint)] mt-2">
            Former recruiters are hidden unless they have numbers in the month you&apos;re viewing. Mark someone as former in
            Team Overview.
          </div>
        </div>
      </div>
    </div>
  );
}

// A color swatch that opens the browser's color picker.
function ColorPick({ value, onChange, label, swatch }: { value: string; onChange: (c: string) => void; label: string; swatch?: boolean }) {
  return (
    <label className={swatch ? "colorSwatch" : "colorCell"} style={swatch ? { background: value } : undefined} title={`Pick a color for ${label}`}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Color for ${label}`} />
    </label>
  );
}
