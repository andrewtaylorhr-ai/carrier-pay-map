"use client";

import { ExternalLink } from "lucide-react";
import { ACADEMY, lessonUrl } from "@/lib/training-program";

// The Academy sections and lessons. With `done` + `onToggle` each lesson gets a
// tick box (a trainee's file); without them it's a plain list of links.
export function AcademyList({ done, onToggle }: { done?: Set<string>; onToggle?: (id: string) => void }) {
  const tickable = !!done && !!onToggle;
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3 items-start">
      {ACADEMY.map((sec) => {
        const n = done ? sec.lessons.filter((l) => done.has(l.id)).length : 0;
        const complete = tickable && n === sec.lessons.length;
        return (
          <section key={sec.title} className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
            <h3 className="flex items-center gap-2 text-[13.5px] font-bold text-[var(--cpm-text)] px-4 py-2.5 border-b border-[var(--cpm-border)]">
              {sec.title}
              {sec.extra && <span className="text-[10.5px] font-semibold text-[var(--cpm-text-faint)]">optional</span>}
              <span className={`ml-auto text-[11.5px] font-semibold ${complete ? "text-[var(--cpm-green)]" : "text-[var(--cpm-text-faint)]"}`}>
                {tickable ? (complete ? "Done ✓" : `${n}/${sec.lessons.length}`) : `${sec.lessons.length} ${sec.lessons.length === 1 ? "lesson" : "lessons"}`}
              </span>
            </h3>
            <ul className="px-2 py-2">
              {sec.lessons.map((l) => {
                const checked = !!done?.has(l.id);
                return (
                  <li key={l.id} className="flex items-start gap-1 rounded-md hover:bg-[var(--cpm-panel-alt)]">
                    {tickable ? (
                      <label className="flex gap-2.5 px-2 py-1.5 flex-1 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={() => onToggle(l.id)} className="mt-0.5 accent-[var(--cpm-green)]" />
                        <span className={`text-[12.5px] ${checked ? "text-[var(--cpm-text-faint)] line-through" : "text-[var(--cpm-text)]"}`}>{l.title}</span>
                      </label>
                    ) : (
                      <a href={lessonUrl(l.id)} target="_blank" rel="noreferrer" className="flex-1 px-2 py-1.5 text-[12.5px] text-[var(--cpm-text)] hover:text-[var(--cpm-accent)]">
                        {l.title}
                      </a>
                    )}
                    <a
                      href={lessonUrl(l.id)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open lesson in Notion"
                      className="p-1.5 mt-px text-[var(--cpm-text-faint)] hover:text-[var(--cpm-accent)] shrink-0"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
