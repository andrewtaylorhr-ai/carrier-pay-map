"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ALL_STATES } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { AssignedBadge, RecruiterBadge } from "./badges";

// Companion list next to the choropleth: one row per state showing its real
// assigned carrier + recruiter(s), sourced entirely from existing context
// state (assignments / recruiterAssignments) — no fabricated per-state
// submission/hire numbers, since this app doesn't track those yet.
export function StateSelectList() {
  const { selectedState, setSelectedState, assignments, recruiterAssignments, recruiterColor } = useCarrierMap();
  const [query, setQuery] = useState("");

  const states = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...ALL_STATES].sort();
    if (!q) return sorted;
    return sorted.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 w-[300px] shrink-0 flex flex-col min-h-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2">
        Select state
      </div>
      <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] mb-2 shrink-0">
        <Search size={13} className="text-[var(--cpm-text-faint)] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search state…"
          className="bg-transparent outline-none text-[12.5px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] w-full"
        />
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[360px] pr-0.5">
        {states.map((s) => {
          const active = selectedState === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedState(s)}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12.5px] transition-colors ${
                active
                  ? "bg-[var(--cpm-accent)] text-[#241800] font-semibold"
                  : "text-[var(--cpm-text-dim)] hover:bg-[var(--cpm-panel-alt)] hover:text-[var(--cpm-text)]"
              }`}
            >
              <span className="truncate">{s}</span>
              <span className="flex items-center gap-1 shrink-0">
                <AssignedBadge carrierId={assignments[s]} />
                <RecruiterBadge names={recruiterAssignments[s] || []} recruiterColor={recruiterColor} />
              </span>
            </button>
          );
        })}
        {states.length === 0 && (
          <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">No states match.</div>
        )}
      </div>
    </div>
  );
}
