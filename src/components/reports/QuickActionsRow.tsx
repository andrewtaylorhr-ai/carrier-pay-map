"use client";

import { FileDown, NotebookPen, Target, Upload } from "lucide-react";

// "Generate report" is real (wired to the same Excel export the Recruiter
// performance table uses). The other three have no backing feature on this
// page — Update Goals/Add Note live on a recruiter's Strategy Plan
// (Dashboard page), and Import Data has no upload pipeline — so they're
// disabled placeholders using the same title="Coming soon" convention used
// elsewhere (Sidebar.tsx, AssignedCarriersPanel.tsx). Single flat row
// (matching the "Executive Dashboard" mockup's Quick Actions block, which
// lays all 4 out side by side rather than a 2x2 grid).
export function QuickActionsRow({ onGenerateReport }: { onGenerateReport: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2.5">
        Quick actions
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          title="Coming soon"
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] opacity-70 cursor-default"
        >
          <Target size={14} />
          Update goals
        </button>
        <button
          type="button"
          title="Coming soon"
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] opacity-70 cursor-default"
        >
          <NotebookPen size={14} />
          Add note
        </button>
        <button
          type="button"
          title="Coming soon"
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] opacity-70 cursor-default"
        >
          <Upload size={14} />
          Import data
        </button>
        <button
          type="button"
          onClick={onGenerateReport}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] hover:bg-[var(--cpm-accent-strong)] transition-colors"
        >
          <FileDown size={14} />
          Generate report
        </button>
      </div>
    </div>
  );
}
