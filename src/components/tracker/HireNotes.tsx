"use client";

// The hidden note on a week's Hire cell: one line per driver hired (full name,
// company, hire date). The cell's hire count is the number of lines.
import { useEffect, useRef } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { CARRIERS, CARRIER_ORDER } from "@/lib/carriers/data";
import { dayLabel, type HireNote, type Week } from "@/lib/tracker";

// Companies offered while typing; any other name can be typed too.
const COMPANIES = [...CARRIER_ORDER.map((id) => CARRIERS[id].label), "Barr-Nunn", "Day & Ross"];

// Swift hires both students and experienced drivers, so its hires say which.
export const needsKind = (n: HireNote) => /swift/i.test(n.company);

export const noteMissing = (n: HireNote) => !n.driver.trim() || !n.company.trim() || (needsKind(n) && !n.kind);

// One line per line of the hover text.
export const notesTitle = (ym: string, notes: HireNote[]) =>
  notes
    .map((n) => {
      const kind = needsKind(n) ? ` (${n.kind ?? "Trainee or Exp?"})` : "";
      return `${n.driver.trim() || "(no name)"} · ${n.company.trim() || "(no company)"}${kind} · ${dayLabel(ym, n.day)}`;
    })
    .join("\n");

export function HireNotesBox({
  recruiter,
  ym,
  week,
  notes,
  at,
  today,
  usedCompanies,
  onChange,
  onClose,
}: {
  recruiter: string;
  ym: string;
  week: Week;
  notes: HireNote[]; // already padded with blank lines up to the cell's count
  at: { x: number; y: number; below: boolean };
  today: number | null;
  usedCompanies: string[];
  onChange: (notes: HireNote[]) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  const defaultDay = today && week.days.includes(today) ? today : week.days[week.days.length - 1];
  const set = (i: number, patch: Partial<HireNote>) => onChange(notes.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const listId = `companies-${recruiter}-${week.idx}`.replace(/\W/g, "");

  return (
    <div
      ref={box}
      className="hireNotes"
      style={{ left: at.x, ...(at.below ? { top: at.y } : { bottom: window.innerHeight - at.y }) }}
      role="dialog"
      aria-label={`Hires for ${recruiter}, week ${week.idx + 1}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[var(--cpm-text)] truncate">{recruiter}</div>
          <div className="text-[11px] text-[var(--cpm-text-faint)]">
            Week {week.idx + 1} · {dayLabel(ym, week.days[0])} – {dayLabel(ym, week.days[week.days.length - 1])}
          </div>
        </div>
        <button type="button" className="iconBtn ml-auto" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      </div>

      {notes.length === 0 && <div className="text-[12px] text-[var(--cpm-text-dim)] py-1">No hires this week yet.</div>}
      <datalist id={listId}>
        {[...new Set([...COMPANIES, ...usedCompanies])].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="flex flex-col gap-1.5">
        {notes.map((n, i) => (
          <div key={i} className={`hireNoteLine${noteMissing(n) ? " missing" : ""}`}>
            <span className="text-[11px] font-bold text-[var(--cpm-text-faint)] w-4 text-right">{i + 1}</span>
            <input
              className="noteIn flex-[3]"
              placeholder="Driver full name"
              value={n.driver}
              autoFocus={i === notes.length - 1 && !n.driver}
              onChange={(e) => set(i, { driver: e.target.value })}
              aria-label={`Hire ${i + 1} driver full name`}
            />
            <input
              className="noteIn flex-[2]"
              placeholder="Company"
              list={listId}
              value={n.company}
              onChange={(e) => set(i, { company: e.target.value, ...(/swift/i.test(e.target.value) ? {} : { kind: undefined }) })}
              aria-label={`Hire ${i + 1} company`}
            />
            {needsKind(n) && (
              <div className="kindPick" role="group" aria-label={`Hire ${i + 1} trainee or experienced`}>
                {(["Trainee", "Exp"] as const).map((k) => (
                  <button key={k} type="button" className={n.kind === k ? "on" : undefined} onClick={() => set(i, { kind: k })}>
                    {k}
                  </button>
                ))}
              </div>
            )}
            <select className="noteIn w-[74px]" value={n.day} onChange={(e) => set(i, { day: Number(e.target.value) })} aria-label={`Hire ${i + 1} date`}>
              {week.days.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(ym, d)}
                </option>
              ))}
            </select>
            <button type="button" className="iconBtn" onClick={() => onChange(notes.filter((_, j) => j !== i))} aria-label={`Remove hire ${i + 1}`}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="ghostBtn mt-2" onClick={() => onChange([...notes, { driver: "", company: "", day: defaultDay }])}>
        <Plus size={14} /> Add hire
      </button>
      <div className="mt-2 text-[10.5px] leading-snug text-[var(--cpm-text-faint)]">
        Each line is one hire; the Hire count fills in from them. Swift hires say Trainee or Exp. Name, company and date only, no SSN or phone.
      </div>
    </div>
  );
}
