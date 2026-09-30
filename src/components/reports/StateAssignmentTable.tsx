"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ALL_STATES } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { AssignedBadge, RecruiterBadge } from "@/components/carrier-map/badges";

// Table form of the same real assignment data StateSelectList shows next to
// the map (assignments / recruiterAssignments) — Submissions/Hires/Hire rate
// stay "—" since this app has no per-state actuals data source.
export function StateAssignmentTable() {
  const { assignments, recruiterAssignments, recruiterColor, setSelectedState } = useCarrierMap();
  const [query, setQuery] = useState("");
  const [assignedOnly, setAssignedOnly] = useState(false);

  const states = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...ALL_STATES].sort();
    if (q) list = list.filter((s) => s.toLowerCase().includes(q));
    if (assignedOnly) list = list.filter((s) => assignments[s] || (recruiterAssignments[s] || []).length);
    return list;
  }, [query, assignedOnly, assignments, recruiterAssignments]);

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          State assignment
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11.5px] text-[var(--cpm-text-dim)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assignedOnly}
              onChange={(e) => setAssignedOnly(e.target.checked)}
              className="accent-[var(--cpm-accent)]"
            />
            Assigned only
          </label>
          <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)]">
            <Search size={12} className="text-[var(--cpm-text-faint)] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state…"
              className="bg-transparent outline-none text-[12px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] w-[120px]"
            />
          </div>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[320px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 bg-[var(--cpm-panel)]">
            <tr className="text-left text-[var(--cpm-text-faint)] text-[10.5px] uppercase tracking-wide">
              <th className="py-1.5 pr-3 font-semibold">State</th>
              <th className="py-1.5 pr-3 font-semibold">Assigned carrier</th>
              <th className="py-1.5 pr-3 font-semibold">Assigned recruiter(s)</th>
              <th className="py-1.5 pr-3 font-semibold">Submissions</th>
              <th className="py-1.5 pr-3 font-semibold">Hires</th>
              <th className="py-1.5 pr-3 font-semibold">Hire rate</th>
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr
                key={s}
                onClick={() => setSelectedState(s)}
                className="border-t border-[var(--cpm-border)] text-[var(--cpm-text-dim)] cursor-pointer hover:bg-[var(--cpm-panel-alt)]"
              >
                <td className="py-1.5 pr-3 text-[var(--cpm-text)] font-semibold whitespace-nowrap">{s}</td>
                <td className="py-1.5 pr-3">
                  <AssignedBadge carrierId={assignments[s]} />
                </td>
                <td className="py-1.5 pr-3">
                  <RecruiterBadge names={recruiterAssignments[s] || []} recruiterColor={recruiterColor} />
                </td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
                <td className="py-1.5 pr-3 text-[var(--cpm-text-faint)]">—</td>
              </tr>
            ))}
            {states.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-[12.5px] text-[var(--cpm-text-faint)] italic text-center">
                  No states match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-[10.5px] text-[var(--cpm-text-faint)] mt-2">
        Submissions/hires aren&apos;t tracked per-state yet — only per-recruiter-per-month (see stats above).
      </div>
    </div>
  );
}
