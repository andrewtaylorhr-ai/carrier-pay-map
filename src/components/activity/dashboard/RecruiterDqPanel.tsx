import type { RecruiterDqRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// Per-recruiter mirror of AccountDqPanel — ranked by DQ rate (worst first)
// so a rejection pattern caught in one recruiter's data can be checked
// against the rest of the roster. recordDate coverage is patchy across
// carriers (see recruiterDqRanked), so each card shows how many of its
// records are actually dated instead of silently filtering to a window
// that would hide most of the history.
export function RecruiterDqPanel({ rows }: { rows: RecruiterDqRow[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Recruiter DQ diagnostic
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Recruiters ranked by rejection rate, with why — spot a problem here, then check whether the same reason shows up for others.
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">
          Not enough decided outcomes per recruiter yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div
              key={r.recruiter}
              className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1.5">
                <span className="font-bold text-[13.5px] text-[var(--cpm-text)]">{r.recruiter}</span>
                <div className="flex items-center gap-3 text-[12px] text-[var(--cpm-text-dim)] shrink-0">
                  <span>{r.counts.total} submissions</span>
                  {r.datedCount < r.counts.total && (
                    <span className="text-[var(--cpm-text-faint)]">
                      {r.datedCount}/{r.counts.total} dated
                    </span>
                  )}
                  <span className="text-[var(--cpm-red)] font-semibold">
                    {r.counts.dq} DQ · {pct(r.dqRate)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.dqReasons.length === 0 ? (
                  <span className="text-[11px] text-[var(--cpm-text-faint)]">No DQs yet</span>
                ) : (
                  r.dqReasons.map((reason) => (
                    <span
                      key={reason.label}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--cpm-red-soft)] text-[#ff9a9d] border border-[var(--cpm-red)]/40 whitespace-nowrap"
                    >
                      {reason.label} <span className="opacity-80">({reason.count})</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
