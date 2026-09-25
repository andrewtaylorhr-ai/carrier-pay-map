import type { CarrierVolumeRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

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
        Rejection rate and the most common reason behind it, per carrier — click a reason chip's carrier to jump to its detail below.
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">No data.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="text-left text-[var(--cpm-text-faint)] uppercase text-[10.5px] tracking-wide">
                <th className="py-1.5 pr-4">Carrier</th>
                <th className="py-1.5 pr-4">Submissions</th>
                <th className="py-1.5 pr-4">Hired</th>
                <th className="py-1.5 pr-4">DQ</th>
                <th className="py-1.5 pr-4">DQ rate</th>
                <th className="py-1.5 pr-4">Top rejection reasons</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.carrier} className="border-t border-[var(--cpm-border)] align-top">
                  <td className="py-2 pr-4 font-medium text-[var(--cpm-text)] whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                      {onSelectCarrier ? (
                        <button
                          type="button"
                          onClick={() => onSelectCarrier(r.carrier)}
                          className="hover:text-[var(--cpm-accent)] hover:underline"
                        >
                          {r.carrier}
                        </button>
                      ) : (
                        r.carrier
                      )}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[var(--cpm-text-dim)]">{r.counts.total}</td>
                  <td className="py-2 pr-4 text-[var(--cpm-text-dim)]">{r.counts.hired}</td>
                  <td className="py-2 pr-4 text-[var(--cpm-text-dim)]">{r.counts.dq}</td>
                  <td className="py-2 pr-4 text-[var(--cpm-red)] font-medium">{pct(r.dqRate)}</td>
                  <td className="py-2 pr-4">
                    {r.dqReasons.length === 0 ? (
                      <span className="text-[var(--cpm-text-faint)]">No DQs yet</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-w-[420px]">
                        {r.dqReasons.slice(0, 3).map((reason) => (
                          <span
                            key={reason.label}
                            title={`${reason.label}: ${reason.count}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--cpm-red-soft)] text-[#ff9a9d] border border-[var(--cpm-red)]/40 whitespace-nowrap"
                          >
                            {reason.label} <span className="opacity-80">({reason.count})</span>
                          </span>
                        ))}
                        {r.dqReasons.length > 3 && (
                          <span className="text-[11px] text-[var(--cpm-text-faint)] self-center">
                            +{r.dqReasons.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
