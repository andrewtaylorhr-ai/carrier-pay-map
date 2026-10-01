"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { ALL_STATES } from "@/lib/carriers/data";
import type { StateMonthlyStat } from "@/lib/carriers/types";

function hireRateOf(hired: number | null, submissions: number | null): string {
  if (!submissions || submissions <= 0 || hired == null) return "—";
  return `${((hired / submissions) * 100).toFixed(2)}%`;
}

const inputCls =
  "bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

// Per-state submission/hire breakdown for one month — the real data source
// behind the map's "Hires" color mode (see useMapStyle.ts). The user asked
// to find the "best state" visually on the map by color rather than via a
// computed text field, so this table's job is purely honest data entry;
// Hire % and % of total submissions are always computed live, never stored,
// matching CarrierBreakdownTable's convention.
export function StateBreakdownTable({ month }: { month: string }) {
  const { getMonthlyReport, updateMonthlyReport } = useCarrierMap();
  const report = getMonthlyReport(month);
  const rows = report.stateBreakdown;

  const totalSubmissions = rows.reduce((s, r) => s + (r.submissions ?? 0), 0);
  const totalHired = rows.reduce((s, r) => s + (r.hired ?? 0), 0);

  const updateRow = (idx: number, patch: Partial<StateMonthlyStat>) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], ...patch };
    updateMonthlyReport(month, { stateBreakdown: next });
  };
  const addRow = () => {
    updateMonthlyReport(month, {
      stateBreakdown: [...rows, { state: "", submissions: null, hired: null, notes: "" }],
    });
  };
  const removeRow = (idx: number) => {
    updateMonthlyReport(month, { stateBreakdown: rows.filter((_, i) => i !== idx) });
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          State breakdown
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[11.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)] transition-colors"
        >
          <Plus size={13} /> Add state
        </button>
      </div>
      <p className="text-[11px] text-[var(--cpm-text-faint)] mb-2.5">
        Feeds the map&apos;s &quot;Hires&quot; color mode — switch to Strategy mode and color by Hires to see your best
        state at a glance.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">State</th>
              <th className="py-1.5 pr-3 font-semibold">Submissions</th>
              <th className="py-1.5 pr-3 font-semibold">Hired</th>
              <th className="py-1.5 pr-3 font-semibold">Hire %</th>
              <th className="py-1.5 pr-3 font-semibold">% of total submissions</th>
              <th className="py-1.5 pr-3 font-semibold">Notes</th>
              <th className="py-1.5 pr-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                <td className="py-1.5 pr-3">
                  <select
                    value={row.state}
                    onChange={(e) => updateRow(idx, { state: e.target.value })}
                    className={`w-36 ${inputCls}`}
                  >
                    <option value="">Select state</option>
                    {ALL_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 pr-3">
                  <input
                    type="number"
                    min={0}
                    value={row.submissions ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      updateRow(idx, { submissions: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className={`w-16 tabular-nums ${inputCls}`}
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <input
                    type="number"
                    min={0}
                    value={row.hired ?? ""}
                    placeholder="—"
                    onChange={(e) => updateRow(idx, { hired: e.target.value === "" ? null : Number(e.target.value) })}
                    className={`w-14 tabular-nums ${inputCls}`}
                  />
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] tabular-nums">
                  {hireRateOf(row.hired, row.submissions)}
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] tabular-nums">
                  {totalSubmissions > 0 && row.submissions != null
                    ? `${((row.submissions / totalSubmissions) * 100).toFixed(2)}%`
                    : "—"}
                </td>
                <td className="py-1.5 pr-3">
                  <input
                    type="text"
                    value={row.notes}
                    placeholder="—"
                    onChange={(e) => updateRow(idx, { notes: e.target.value })}
                    className={`w-32 ${inputCls}`}
                  />
                </td>
                <td className="py-1.5 pr-3">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-[var(--cpm-text-faint)] hover:text-[var(--cpm-red)] transition-colors"
                    title="Remove state"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-[12.5px] text-[var(--cpm-text-faint)] italic">
                  No state rows yet — click &quot;Add state&quot; to start.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[var(--cpm-border-strong)] text-[var(--cpm-text)] font-semibold">
                <td className="py-1.5 pr-3">
                  Total ({rows.length} state{rows.length > 1 ? "s" : ""})
                </td>
                <td className="py-1.5 pr-3 tabular-nums">{totalSubmissions || "—"}</td>
                <td className="py-1.5 pr-3 tabular-nums">{totalHired || "—"}</td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] font-normal tabular-nums">
                  {hireRateOf(totalHired, totalSubmissions)}
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)] font-normal tabular-nums">
                  {totalSubmissions > 0 ? "100.00%" : "—"}
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
