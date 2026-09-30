"use client";

import { Lightbulb } from "lucide-react";

// The mockup's "Manager Insights" panel implies AI-generated narrative
// commentary — nothing in this app generates that, so rather than fabricate
// sample insights, this renders the same honest empty-state convention used
// by MonthlyTrendCard ("No submissions/hires data tracked yet.").
export function ManagerInsightsCard() {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-[2] min-w-[260px] flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={14} className="text-[var(--cpm-accent)]" />
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Manager insights
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--cpm-text-faint)] py-6 text-center">
        No automated insights yet — this app doesn&apos;t generate narrative commentary. See the Data coverage panel
        below for concrete gaps to review.
      </div>
    </div>
  );
}
