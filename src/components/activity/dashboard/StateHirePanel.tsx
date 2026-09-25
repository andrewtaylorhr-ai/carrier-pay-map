import type { StateHireRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// Best-effort state-level rollup — states are inferred from account names
// (see statesFromAccount), not a real field, so this reads as "where the
// wins are showing up" rather than a precise geographic breakdown.
export function StateHirePanel({ rows }: { rows: StateHireRow[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Most-hired states
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Best-effort — states detected in account/lane names, ranked by hires.
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">
          No states detected in account names yet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rows.map((r) => (
            <div
              key={r.state}
              className="flex items-center gap-2.5 rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-3 py-2"
            >
              <span className="text-[15px] font-bold text-[var(--cpm-text)]">{r.state}</span>
              <span className="flex flex-col leading-tight">
                <span className="text-[12px] text-[var(--cpm-green)] font-semibold">{r.counts.hired} hired</span>
                <span className="text-[11px] text-[var(--cpm-text-faint)]">
                  {r.counts.total} subs · {pct(r.hireRate)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
