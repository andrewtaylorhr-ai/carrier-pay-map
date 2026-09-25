import type { CarrierVolumeRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// Card list instead of a wide `<table>` — a table here needs 6 columns
// including a variable-length reason-chip list, which on a narrow/mobile
// screen scrolls the carrier name off-screen and leaves only anonymous
// chips visible (the exact problem reported against the first version of
// this component). Each carrier's identity now sits directly above its own
// reasons with no horizontal scrolling required at any width.
export function CarrierPerformanceTable({
  rows,
  onSelectCarrier,
}: {
  rows: CarrierVolumeRow[];
  onSelectCarrier?: (carrier: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Carrier performance
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Rejection rate and the most common reasons behind it, per carrier.
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">No data.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.carrier} className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-3">
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1.5">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  {onSelectCarrier ? (
                    <button
                      type="button"
                      onClick={() => onSelectCarrier(r.carrier)}
                      className="font-semibold text-[13.5px] text-[var(--cpm-text)] hover:text-[var(--cpm-accent)] hover:underline truncate"
                    >
                      {r.carrier}
                    </button>
                  ) : (
                    <span className="font-semibold text-[13.5px] text-[var(--cpm-text)] truncate">{r.carrier}</span>
                  )}
                </span>
                <div className="flex items-center gap-3 text-[12px] text-[var(--cpm-text-dim)] shrink-0">
                  <span>{r.counts.total} submissions</span>
                  <span>{r.counts.hired} hired</span>
                  <span className="text-[var(--cpm-red)] font-semibold">
                    {r.counts.dq} DQ · {pct(r.dqRate)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.dqReasons.length === 0 ? (
                  <span className="text-[11.5px] text-[var(--cpm-text-faint)]">No DQs yet.</span>
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
