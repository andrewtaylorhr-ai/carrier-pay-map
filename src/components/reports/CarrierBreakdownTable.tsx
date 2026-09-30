"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { CarrierMonthlyStat } from "@/lib/carriers/types";

function hireRateOf(hired: number | null, submissions: number | null): string {
  if (!submissions || submissions <= 0 || hired == null) return "—";
  return `${((hired / submissions) * 100).toFixed(2)}%`;
}

const inputCls =
  "bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded px-1.5 py-0.5 text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

// Per-carrier submission/DQ/hire breakdown for one month — free-text carrier
// names (not CarrierId) since the real submission pipeline spans 20+
// carriers the map's 5-carrier territory-assignment enum doesn't cover.
// Hire % and % of total submissions are always computed live from the
// Submissions/Hired columns, never stored, matching hireRateOf() elsewhere.
export function CarrierBreakdownTable({ month }: { month: string }) {
  const { getMonthlyReport, updateMonthlyReport } = useCarrierMap();
  const report = getMonthlyReport(month);
  const rows = report.carriers;

  const totalSubmissions = rows.reduce((s, c) => s + (c.submissions ?? 0), 0);
  const totalDq = rows.reduce((s, c) => s + (c.dqNoResponse ?? 0), 0);
  const totalHired = rows.reduce((s, c) => s + (c.hired ?? 0), 0);

  const updateRow = (idx: number, patch: Partial<CarrierMonthlyStat>) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], ...patch };
    updateMonthlyReport(month, { carriers: next });
  };
  const addRow = () => {
    updateMonthlyReport(month, {
      carriers: [...rows, { carrier: "", submissions: null, dqNoResponse: null, hired: null, notes: "" }],
    });
  };
  const removeRow = (idx: number) => {
    updateMonthlyReport(month, { carriers: rows.filter((_, i) => i !== idx) });
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Carrier breakdown
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[11.5px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)] transition-colors"
        >
          <Plus size={13} /> Add carrier
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">Carrier</th>
              <th className="py-1.5 pr-3 font-semibold">Submissions</th>
              <th className="py-1.5 pr-3 font-semibold">DQ / No response</th>
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
                  <input
                    type="text"
                    value={row.carrier}
                    placeholder="Carrier name"
                    onChange={(e) => updateRow(idx, { carrier: e.target.value })}
                    className={`w-32 ${inputCls}`}
                  />
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
                    value={row.dqNoResponse ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      updateRow(idx, { dqNoResponse: e.target.value === "" ? null : Number(e.target.value) })
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
                    title="Remove carrier"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-[12.5px] text-[var(--cpm-text-faint)] italic">
                  No carrier rows yet — click &quot;Add carrier&quot; to start.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[var(--cpm-border-strong)] text-[var(--cpm-text)] font-semibold">
                <td className="py-1.5 pr-3">
                  Total ({rows.length} carrier{rows.length > 1 ? "s" : ""})
                </td>
                <td className="py-1.5 pr-3 tabular-nums">{totalSubmissions || "—"}</td>
                <td className="py-1.5 pr-3 tabular-nums">{totalDq || "—"}</td>
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
