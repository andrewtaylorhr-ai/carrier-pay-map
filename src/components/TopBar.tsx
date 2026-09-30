"use client";

import { Calendar, ChevronDown, Search, UserCircle } from "lucide-react";

// Decorative top bar for the Dashboard shell. Mostly static — no
// date-filtered data model or auth exists in this solo-user tool, so the
// search box, date range, and profile chip are visual furniture matching the
// reference mockup rather than wired-up controls. The date range itself is
// genuinely computed from today's real date (not a fabricated sample range)
// so it's honest even though nothing on the page actually filters by it yet.
function sixMonthRangeLabel(): string {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
}

export function TopBar() {
  return (
    <div className="flex items-center justify-between gap-2.5 px-6 h-14 border-b border-[var(--cpm-border)]">
      <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12px] text-[var(--cpm-text-faint)] w-full max-w-[320px]">
        <Search size={13} className="shrink-0" />
        <input
          type="text"
          placeholder="Search drivers, recruiters, carriers, states..."
          className="bg-transparent outline-none text-[12px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] w-full"
        />
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12px] text-[var(--cpm-text-dim)]">
          <Calendar size={13} />
          {sixMonthRangeLabel()}
          <ChevronDown size={13} className="text-[var(--cpm-text-faint)]" />
        </div>
        <div className="flex items-center gap-2 pl-1 pr-2.5 h-8 rounded-lg bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)]">
          <UserCircle size={20} className="text-[var(--cpm-text-faint)]" />
          <div className="leading-tight">
            <div className="text-[11.5px] font-semibold text-[var(--cpm-text)]">Manager</div>
            <div className="text-[9.5px] text-[var(--cpm-text-faint)]">General Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
}
