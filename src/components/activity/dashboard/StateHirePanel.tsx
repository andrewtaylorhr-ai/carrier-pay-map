import type { StateHireRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// Best-effort state-level rollup — states are inferred from account names
// (see statesFromAccount), not a real field, so this reads as "where the
// wins are showing up" rather than a precise geographic breakdown. Same
// card-list shape as AccountSuccessPanel/AccountDqPanel, with a per-carrier
// hire breakdown in place of DQ-reason chips.
export function StateHirePanel({ rows }: { rows: StateHireRow[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Most-hired states
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Best-effort — states detected in account/lane names, ranked by hires, with the carriers behind them.
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">
          No states detected in account names yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div
              key={r.state}
              className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1.5">
                <span className="font-bold text-[13.5px] text-[var(--cpm-text)]">{r.state}</span>
                <div className="flex items-center gap-3 text-[12px] text-[var(--cpm-text-dim)] shrink-0">
                  <span>{r.counts.total} submissions</span>
                  <span className="text-[var(--cpm-green)] font-semibold">
                    {r.counts.hired} hired · {pct(r.hireRate)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.byCarrier.map((c) => (
                  <span
                    key={c.carrier}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--cpm-green-soft)] text-[#4ade80] border border-[var(--cpm-green)]/40 whitespace-nowrap"
                  >
                    {c.carrier} <span className="opacity-80">({c.hired})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
