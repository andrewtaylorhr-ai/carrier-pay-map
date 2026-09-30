"use client";

import { Upload } from "lucide-react";

// Page header for /reports, matching the "Executive Dashboard" reference
// mockup's title/subtitle/timestamp. "Last updated" is genuinely honest, not
// fabricated: every number on this page is computed live from current
// context state on every render, so "now" (render time) really is the last
// time the numbers were refreshed. Import Data has no backing feature yet
// (no file-upload/ATS integration), so it stays a disabled placeholder using
// the same title="Coming soon" + opacity-70 cursor-default convention as
// Sidebar.tsx / AssignedCarriersPanel.tsx — restyled to the mockup's blue
// accent button look, but still non-functional.
export function ReportsHeader() {
  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
      <div>
        <h1 className="text-xl font-semibold mb-1 text-[var(--cpm-text)]">Executive Dashboard</h1>
        <p className="text-[13px] text-[var(--cpm-text-dim)]">Your recruiting performance at a glance.</p>
        <p className="text-[11.5px] text-[var(--cpm-text-faint)] mt-1">Last updated {lastUpdated}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          title="Coming soon"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] opacity-70 cursor-default"
        >
          <Upload size={14} />
          Import Data
        </button>
      </div>
    </div>
  );
}
