"use client";

import { Upload } from "lucide-react";

// Page header for /reports. "Data refreshed live" is honest — every number
// below is computed on render from current context state, not a cached
// snapshot — so there's no real "last updated" timestamp to track separately.
// Import Data has no backing feature yet (no file-upload/ATS integration),
// so it's a disabled placeholder using the same title="Coming soon" +
// opacity-70 cursor-default convention as Sidebar.tsx / AssignedCarriersPanel.tsx.
export function ReportsHeader() {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
      <div>
        <h1 className="text-xl font-semibold mb-1">Reports</h1>
        <p className="text-[13px] text-[var(--cpm-text-dim)]">
          Target vs. actual submissions and hires for every recruiter, state/carrier assignment coverage, and data
          quality — computed live from current assignments, plans, and actuals.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="px-2.5 h-7 inline-flex items-center rounded-full border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[11px] text-[var(--cpm-text-faint)]">
          Data refreshed live
        </span>
        <button
          type="button"
          title="Coming soon"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] opacity-70 cursor-default"
        >
          <Upload size={14} />
          Import data
        </button>
      </div>
    </div>
  );
}
