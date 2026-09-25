"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { RecruiterPerfRow } from "@/lib/activity/dashboardStats";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

export function RecruiterPerformanceTable({
  rows,
  carriers,
  onSelectCarrier,
}: {
  rows: RecruiterPerfRow[];
  carriers: string[];
  onSelectCarrier?: (carrier: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const allStates = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.states.forEach((st) => s.add(st)));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (search && !r.recruiter.toLowerCase().includes(search.toLowerCase())) return false;
    if (carrierFilter && !r.carriers.includes(carrierFilter)) return false;
    if (stateFilter && !r.states.includes(stateFilter)) return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Recruiter performance
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--cpm-text-faint)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recruiter…"
              className="pl-7 pr-2.5 py-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)] text-[12px] placeholder:text-[var(--cpm-text-faint)] focus:outline-none focus:border-[var(--cpm-accent)] w-[150px]"
            />
          </div>
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)] text-[12px] focus:outline-none focus:border-[var(--cpm-accent)]"
          >
            <option value="">All carriers</option>
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)] text-[12px] focus:outline-none focus:border-[var(--cpm-accent)]"
          >
            <option value="">All states</option>
            {allStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)] py-6 text-center">
          No recruiter names were detected in the imported data yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="text-left text-[var(--cpm-text-faint)] uppercase text-[10.5px] tracking-wide">
                <th className="py-1.5 pr-4">Recruiter</th>
                <th className="py-1.5 pr-4">Total submissions</th>
                <th className="py-1.5 pr-4">Total hires</th>
                <th className="py-1.5 pr-4">Hire rate</th>
                <th className="py-1.5 pr-4">Top carrier</th>
                <th className="py-1.5 pr-4">Top account</th>
                <th className="py-1.5 pr-4">Top state(s)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-[var(--cpm-text-faint)]">
                    No recruiters match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.recruiter} className="border-t border-[var(--cpm-border)]">
                    <td className="py-1.5 pr-4 font-medium text-[var(--cpm-text)] whitespace-nowrap">{r.recruiter}</td>
                    <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.counts.total}</td>
                    <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.counts.hired}</td>
                    <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{pct(r.rate)}</td>
                    <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)] whitespace-nowrap">
                      {r.topCarrier ? (
                        onSelectCarrier ? (
                          <button
                            type="button"
                            onClick={() => onSelectCarrier(r.topCarrier as string)}
                            className="hover:text-[var(--cpm-accent)] hover:underline"
                          >
                            {r.topCarrier}
                          </button>
                        ) : (
                          r.topCarrier
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.topAccount ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)] whitespace-nowrap">
                      {r.topStates.length > 0 ? r.topStates.join(", ") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
