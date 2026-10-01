"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { DqReasonStat } from "@/lib/carriers/types";

const inputCls =
  "bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

// Per-month breakdown of why drivers were DQ'd/lost. "% of Lost Drivers" is
// always computed live against the month's Total DQP figure (never stored),
// matching this app's "derive, don't duplicate" convention used throughout
// the other Monthly Report tables.
export function DqReasonsTable({ month }: { month: string }) {
  const { getMonthlyReport, updateMonthlyReport } = useCarrierMap();
  const report = getMonthlyReport(month);
  const rows = report.dqReasons;
  const totalDqp = report.totalDqp ?? 0;

  const totalCount = rows.reduce((s, r) => s + (r.count ?? 0), 0);

  const updateRow = (idx: number, patch: Partial<DqReasonStat>) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], ...patch };
    updateMonthlyReport(month, { dqReasons: next });
  };
  const addRow = () => {
    updateMonthlyReport(month, { dqReasons: [...rows, { reason: "", count: null, notes: "" }] });
  };
  const removeRow = (idx: number) => {
    updateMonthlyReport(month, { dqReasons: rows.filter((_, i) => i !== idx) });
  };

  const pctOfLost = (count: number | null): string => {
    if (!totalDqp || totalDqp <= 0 || count == null) return "—";
    return `${((count / totalDqp) * 100).toFixed(2)}%`;
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Reason for DQ
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[11.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)] transition-colors"
        >
          <Plus size={13} /> Add reason
        </button>
      </div>
      <p className="text-[11px] text-[var(--cpm-text-faint)] mb-2.5">
        % of Lost Drivers is each reason&apos;s count divided by this month&apos;s Total DQP ({totalDqp || "—"}).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">Reason</th>
              <th className="py-1.5 pr-3 font-semibold">Count</th>
              <th className="py-1.5 pr-3 font-semibold">% of lost drivers</th>
              <th className="py-1.5 pr-3 font-semibold">Notes</th>
              <th className="py-1.5 pr-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                <td className="py-1.5 pr-3">
                  <input
                    type="text"
                    value={row.reason}
                    placeholder="Reason"
                    onChange={(e) => updateRow(idx, { reason: e.target.value })}
                    className={`w-40 ${inputCls}`}
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <input
                    type="number"
                    min={0}
                    value={row.count ?? ""}
                    placeholder="—"
                    onChange={(e) => updateRow(idx, { count: e.target.value === "" ? null : Number(e.target.value) })}
                    className={`w-16 tabular-nums ${inputCls}`}
                  />
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] tabular-nums">{pctOfLost(row.count)}</td>
                <td className="py-1.5 pr-3">
                  <input
                    type="text"
                    value={row.notes}
                    placeholder="—"
                    onChange={(e) => updateRow(idx, { notes: e.target.value })}
                    className={`w-40 ${inputCls}`}
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-[var(--cpm-text-faint)] hover:text-[var(--cpm-red)] transition-colors"
                    title="Remove reason"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-[12.5px] text-[var(--cpm-text-faint)] italic">
                  No DQ reasons yet — click &quot;Add reason&quot; to start.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[var(--cpm-border-strong)] text-[var(--cpm-text)] font-semibold">
                <td className="py-1.5 pr-3">
                  Total ({rows.length} reason{rows.length > 1 ? "s" : ""})
                </td>
                <td className="py-1.5 pr-3 tabular-nums">{totalCount || "—"}</td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] font-normal tabular-nums">
                  {pctOfLost(totalCount)}
                </td>
                <td className="py-1.5 pr-3" />
                <td className="py-1.5 pr-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
