"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ALL_STATES, CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";

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
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 w-full lg:w-[300px] shrink-0 flex flex-col min-h-0">
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
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[520px] pr-0.5">
        {states.map((s) => {
          const active = selectedState === s;
          const carriers = assignments[s] || [];
          const names = recruiterAssignments[s] || [];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedState(s)}
              className={`flex flex-col gap-1 px-2.5 py-2 rounded-lg text-left transition-colors border ${
                active
                  ? "bg-[rgba(212,161,55,0.12)] border-[var(--cpm-accent)]"
                  : "border-transparent hover:bg-[var(--cpm-panel-alt)]"
              }`}
            >
              <span className="flex items-center justify-between gap-2 w-full">
                <span className={`text-[12.5px] font-semibold ${active ? "text-[var(--cpm-accent-strong)]" : "text-[var(--cpm-text)]"}`}>
                  {s}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {carriers.length ? (
                    carriers.map((id) => (
                      <i
                        key={id}
                        title={CARRIERS[id].label}
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: CARRIERS[id].color }}
                      />
                    ))
                  ) : (
                    <span className="text-[10.5px] text-[var(--cpm-text-faint)]">no carrier</span>
                  )}
                </span>
              </span>
              <span className="text-[11px] text-[var(--cpm-text-faint)] leading-snug">
                {names.length ? (
                  names.map((r, i) => (
                    <span key={r}>
                      {i > 0 && ", "}
                      <span style={{ color: recruiterColor(r) }}>●</span> {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[#ff9a9d]">No recruiter</span>
                )}
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
