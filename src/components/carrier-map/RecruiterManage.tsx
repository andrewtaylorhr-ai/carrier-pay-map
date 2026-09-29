"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";

// Restyled to match the rest of the redesigned dashboard (Tailwind +
// var(--cpm-*) tokens, flat chips, gold accent button) instead of the old
// bright-green button / candy-pill-chip look. Same underlying data and
// handlers as before (recruiters / addRecruiter / removeRecruiter) — purely
// a visual pass.
export function RecruiterManage() {
  const { strategyMode, recruiters, recruiterColor, addRecruiter, removeRecruiter } = useCarrierMap();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  if (!strategyMode) return null;

  const doAdd = () => {
    const problem = addRecruiter(name);
    if (problem) {
      setErr(problem);
      return;
    }
    setName("");
    setErr("");
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 mb-3">
      <div className="flex items-baseline gap-2.5 flex-wrap mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Recruiters
        </div>
        <div className="text-[11.5px] text-[var(--cpm-text-faint)]">
          Add new hires or remove recruiters who&apos;ve left — updates the map + report instantly.
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {recruiters.map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg text-[12.5px] font-medium text-[var(--cpm-text)] bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] hover:border-[var(--cpm-border-strong)] transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10" style={{ background: recruiterColor(r) }} />
            {r}
            <button
              type="button"
              title={`Remove ${r}`}
              onClick={() => {
                if (!confirm(`Remove ${r}? Their state assignments will be cleared.`)) return;
                removeRecruiter(r);
              }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-[var(--cpm-text-faint)] hover:bg-[var(--cpm-red)] hover:text-white transition-colors"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[var(--cpm-border)]">
        <input
          type="text"
          placeholder="New recruiter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doAdd();
            }
          }}
          className="flex-1 min-w-[170px] px-2.5 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] outline-none focus:border-[var(--cpm-accent)]"
        />
        <button
          type="button"
          onClick={doAdd}
          className="px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)] transition-colors"
        >
          + Add recruiter
        </button>
        {err && <span className="text-[11.5px] text-[var(--cpm-red)] w-full">{err}</span>}
      </div>
    </div>
  );
}
