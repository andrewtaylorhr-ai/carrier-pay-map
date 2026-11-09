"use client";

import { useState } from "react";
import type { AgencyCarrier } from "@/lib/agency-carriers";
import { AGENCIES_KEY, type Agency } from "@/lib/agencies";
import { ALL_STATES } from "@/lib/carriers/data";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const input =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";
const label = "text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]";

// One agency-only carrier: its fleets with hiring states, pay and home time,
// filterable by category and by the driver's state.
export function AgencyCarrierView({ carrier }: { carrier: AgencyCarrier }) {
  const [agencies] = useLocalStorageState<Agency[]>(AGENCIES_KEY, []);
  const [cat, setCat] = useState("");
  const [state, setState] = useState("");
  const fleets = carrier.fleets.filter((f) => (!cat || f.cat === cat) && (!state || f.states.includes(state)));
  const states = ALL_STATES.filter((s) => carrier.fleets.some((f) => f.states.includes(s)));
  const working = agencies.filter((a) => a.status !== "stopped" && a.carriers.includes(carrier.id));

  return (
    <div className="flex flex-col gap-3 max-w-[1100px]">
      <div className={`${card} px-4 py-3 flex items-center gap-3 flex-wrap`}>
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: carrier.color }} />
        <span className="text-[17px] font-bold text-[var(--cpm-text)]">{carrier.label}</span>
        <span className="text-[12px] text-[var(--cpm-text-faint)]">
          {carrier.fleets.length} fleets · {states.length} hiring states · {carrier.experience}
        </span>
        <span className="ml-auto text-[12px] text-[var(--cpm-text-dim)]">
          Agencies working it: {working.length ? working.map((a) => a.name).join(", ") : <span className="text-[var(--cpm-text-faint)]">none yet</span>}
        </span>
      </div>

      <div
        className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--cpm-text-dim)] [&_b]:text-[var(--cpm-text)]"
        dangerouslySetInnerHTML={{ __html: carrier.note }}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="segTabs">
          {["", ...carrier.cats].map((c) => (
            <button key={c || "all"} type="button" className={cat === c ? "active" : undefined} onClick={() => setCat(c)}>
              {c || "All fleets"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--cpm-text-dim)]">
          Driver lives in
          <select className={input} value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Any state</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <span className="text-[12px] text-[var(--cpm-text-faint)]">
          {fleets.length} of {carrier.fleets.length} fleets
        </span>
      </div>

      {fleets.length ? (
        <div className="grid gap-3 lg:grid-cols-2 items-start">
          {fleets.map((f) => (
            <div key={f.id} className={`${card} px-4 py-3 flex flex-col gap-1.5`}>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[var(--cpm-text)]">{f.name}</span>
                <span className="ml-auto text-[10.5px] font-semibold px-2 py-px rounded-full border border-[var(--cpm-border-strong)] text-[var(--cpm-text-faint)]">
                  {f.cat}
                </span>
              </div>
              <div className="text-[13px] font-semibold" style={{ color: f.payText.startsWith("Pay not") ? "#ff9a9d" : "var(--cpm-green)" }}>
                {f.payText}
              </div>
              <div className="text-[12.5px] text-[var(--cpm-text)]">
                <span className="text-[var(--cpm-text-faint)]">Home time: </span>
                {f.hometime}
              </div>
              <div className="text-[12px] text-[var(--cpm-text-dim)]">{f.notes}</div>
              <div className={`${label} mt-1`}>Hiring states ({f.states.length})</div>
              <div className="flex flex-wrap gap-1">
                {f.states.map((s) => (
                  <span
                    key={s}
                    className={`text-[11px] px-1.5 py-px rounded border ${
                      s === state ? "border-[var(--cpm-accent)] text-[var(--cpm-accent)]" : "border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)]"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${card} px-4 py-6 text-center text-[12.5px] text-[var(--cpm-text-faint)]`}>No {carrier.label} fleet hires there.</div>
      )}
    </div>
  );
}
