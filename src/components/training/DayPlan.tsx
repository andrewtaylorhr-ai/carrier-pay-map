"use client";

import { ExternalLink } from "lucide-react";
import { ACADEMY, THREE_DAY_PLAN, dayItems, lessonUrl, type PlanItem } from "@/lib/training-program";

// The 3-day plan. With `done` + `onToggle` every lesson, task and check gets a
// tick box (a trainee's file) and `today` highlights the current day; without
// them it's the plan with links, for reading.
export function DayPlan({ done, onToggle, today = 0 }: { done?: Set<string>; onToggle?: (id: string) => void; today?: number }) {
  const tickable = !!done && !!onToggle;
  const extra = ACADEMY.filter((s) => s.extra).flatMap((s) => s.lessons);

  const row = (item: PlanItem, check = false) => {
    const checked = !!done?.has(item.id);
    const text = (
      <span
        className={`text-[12.5px] ${check ? "font-semibold" : ""} ${checked ? "text-[var(--cpm-text-faint)] line-through" : "text-[var(--cpm-text)]"}`}
      >
        {item.title}
      </span>
    );
    return (
      <li key={item.id} className={`flex items-start gap-1 rounded-md hover:bg-[var(--cpm-panel-alt)] ${check ? "bg-[var(--cpm-panel-alt)]" : ""}`}>
        {tickable ? (
          <label className="flex gap-2.5 px-2 py-1.5 flex-1 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)} className="mt-0.5 accent-[var(--cpm-green)]" />
            {text}
          </label>
        ) : item.lesson ? (
          <a href={lessonUrl(item.id)} target="_blank" rel="noreferrer" className="flex-1 px-2 py-1.5 hover:[&>span]:text-[var(--cpm-accent)]">
            {text}
          </a>
        ) : (
          <span className="flex-1 px-2 py-1.5">
            {!item.lesson && <span className="text-[11px] font-semibold text-[var(--cpm-text-faint)] mr-1.5">{check ? "CHECK" : "TASK"}</span>}
            {text}
          </span>
        )}
        {item.lesson && (
          <a href={lessonUrl(item.id)} target="_blank" rel="noreferrer" title="Open lesson in Notion" className="p-1.5 mt-px text-[var(--cpm-text-faint)] hover:text-[var(--cpm-accent)] shrink-0">
            <ExternalLink size={13} />
          </a>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {THREE_DAY_PLAN.map((d) => {
        const items = dayItems(d);
        const n = done ? items.filter((i) => done.has(i.id)).length : 0;
        const lessons = items.filter((i) => i.lesson).length;
        const complete = tickable && n === items.length;
        const isToday = tickable && today === d.day;
        const behind = tickable && today > d.day && !complete;
        return (
          <section
            key={d.day}
            className={`rounded-xl border bg-[var(--cpm-panel)] ${isToday ? "border-[var(--cpm-accent)]" : behind ? "border-[#e5484d]" : "border-[var(--cpm-border)]"}`}
          >
            <h3 className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-[var(--cpm-border)]">
              <span className="text-[14px] font-bold text-[var(--cpm-text)]">
                Day {d.day} · {d.title}
              </span>
              {isToday && <span className="text-[10.5px] font-bold px-1.5 py-px rounded bg-[var(--cpm-accent)] text-[#241800]">TODAY</span>}
              {behind && <span className="text-[10.5px] font-bold px-1.5 py-px rounded bg-[#e5484d] text-white">BEHIND</span>}
              <span className={`ml-auto text-[11.5px] font-semibold ${complete ? "text-[var(--cpm-green)]" : "text-[var(--cpm-text-faint)]"}`}>
                {tickable ? (complete ? "Done ✓" : `${n}/${items.length}`) : `${lessons} lessons`}
              </span>
            </h3>
            <div className="grid gap-x-4 md:grid-cols-2 2xl:grid-cols-3 px-2 py-2">
              {d.parts.map((p) => (
                <div key={p.label} className="py-1">
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">{p.label}</div>
                  <ul>{p.items.map((i) => row(i))}</ul>
                </div>
              ))}
            </div>
            <ul className="px-2 pb-2">{row(d.check, true)}</ul>
          </section>
        );
      })}
      <section className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
        <h3 className="flex items-center px-4 py-2.5 border-b border-[var(--cpm-border)] text-[13.5px] font-bold text-[var(--cpm-text)]">
          Extra reading <span className="ml-2 text-[10.5px] font-semibold text-[var(--cpm-text-faint)]">optional, for evenings or later</span>
        </h3>
        <ul className="px-2 py-2">{extra.map((l) => row({ ...l, lesson: true }))}</ul>
      </section>
    </div>
  );
}
