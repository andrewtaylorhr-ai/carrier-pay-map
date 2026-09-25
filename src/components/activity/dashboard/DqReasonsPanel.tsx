import type { DqReasonRow } from "@/lib/activity/dqReasons";

export function DqReasonsPanel({ reasons, totalDq }: { reasons: DqReasonRow[]; totalDq: number }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Rejection reasons — all carriers
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Best-effort, categorized from each DQ record&apos;s status note.
      </div>
      {reasons.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)]">No DQ records yet.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {reasons.map((r) => {
            const max = reasons[0].count;
            const width = Math.max(4, Math.round((r.count / max) * 100));
            const share = totalDq > 0 ? Math.round((r.count / totalDq) * 100) : 0;
            return (
              <div key={r.label} className="text-[12.5px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--cpm-text)] font-medium">{r.label}</span>
                  <span className="text-[var(--cpm-text-dim)] shrink-0">
                    {r.count} ({share}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--cpm-panel-alt)] mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--cpm-red)]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
