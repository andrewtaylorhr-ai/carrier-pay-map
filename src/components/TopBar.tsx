"use client";

import { Calendar, ChevronDown, UserCircle } from "lucide-react";

// Decorative top bar for the Dashboard shell. Purely static for now — no
// date-filtered data model or auth exists in this solo-user tool, so the
// date range and profile chip are visual furniture matching the reference
// mockup rather than wired-up controls.
export function TopBar() {
  return (
    <div className="flex items-center justify-end gap-2.5 px-6 h-14 border-b border-[var(--cpm-border)]">
      <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12px] text-[var(--cpm-text-dim)]">
        <Calendar size={13} />
        Last 6 months
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
  );
}
