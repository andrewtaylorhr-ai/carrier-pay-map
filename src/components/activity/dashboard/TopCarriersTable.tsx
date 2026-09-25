import type { CarrierVolumeRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

export function TopCarriersTable({
  rows,
  onSelectCarrier,
}: {
  rows: CarrierVolumeRow[];
  onSelectCarrier?: (carrier: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        Top carriers
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">No data.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="text-left text-[var(--cpm-text-faint)] uppercase text-[10.5px] tracking-wide">
                <th className="py-1.5 pr-4">Carrier</th>
                <th className="py-1.5 pr-4">Recruiters</th>
                <th className="py-1.5 pr-4">Submissions</th>
                <th className="py-1.5 pr-4">Hires</th>
                <th className="py-1.5 pr-4">Hire rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.carrier} className="border-t border-[var(--cpm-border)]">
                  <td className="py-1.5 pr-4 font-medium text-[var(--cpm-text)] whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                      {onSelectCarrier ? (
                        <button type="button" onClick={() => onSelectCarrier(r.carrier)} className="hover:text-[var(--cpm-accent)] hover:underline">
                          {r.carrier}
                        </button>
                      ) : (
                        r.carrier
                      )}
                    </span>
                  </td>
                  <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.recruiterCount}</td>
                  <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.counts.total}</td>
                  <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.counts.hired}</td>
                  <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{pct(r.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
