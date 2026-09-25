"use client";

import type { HireIssue } from "@/lib/activity/hirePerformance";
import { OUTCOME_COLOR } from "./RecruiterHireChart";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

// The "needs follow-up" companion to the two summary charts — same
// pending/reversed issues that live inside each recruiter's card below,
// just flattened across recruiters and sorted most-recent-first so the
// newest problem is the first thing visible, not buried inside whichever
// recruiter's card happens to sort to the top.
export function RecentIssuesTable({ issues }: { issues: HireIssue[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        Needs follow-up
      </div>
      {issues.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-8 text-center flex-1 flex items-center justify-center">
          No pending or reversed hires in this window.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--cpm-border)] overflow-y-auto max-h-[220px]">
          {issues.map((issue, i) => (
            <div key={`${issue.recruiter}-${issue.name}-${i}`} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
              <span
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: issue.outcome === "reversed" ? OUTCOME_COLOR.reversed : OUTCOME_COLOR.pending }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-[12.5px] text-[var(--cpm-text)] truncate">{issue.name}</span>
                  <span className="text-[11px] text-[var(--cpm-text-faint)] truncate">{issue.recruiter}</span>
                </div>
                <div className="text-[11px] text-[var(--cpm-text-faint)] truncate">{issue.carrier}</div>
              </div>
              <span className="text-[11px] text-[var(--cpm-text-faint)] shrink-0">{formatDate(issue.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
