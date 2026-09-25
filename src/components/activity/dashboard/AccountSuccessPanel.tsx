import type { AccountSuccessRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// Positive mirror of AccountDqPanel — which accounts/lanes are actually
// converting, ranked by hire count (volume of wins), not just rate.
export function AccountSuccessPanel({ rows }: { rows: AccountSuccessRow[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Most successful accounts
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Top accounts/lanes by hires, per carrier.
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">No hires yet.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div
              key={`${r.carrier} ${r.account}`}
              className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1.5">
                <span className="min-w-0">
                  <span className="font-semibold text-[13.5px] text-[var(--cpm-text)] truncate">{r.account}</span>
                  <span className="text-[11.5px] text-[var(--cpm-text-faint)] ml-2">{r.carrier}</span>
                </span>
                <div className="flex items-center gap-3 text-[12px] text-[var(--cpm-text-dim)] shrink-0">
                  <span>{r.counts.total} submissions</span>
                  <span className="text-[var(--cpm-green)] font-semibold">
                    {r.counts.hired} hired · {pct(r.hireRate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
