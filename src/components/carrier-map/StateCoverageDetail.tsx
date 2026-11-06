"use client";

import { useState } from "react";
import { formatPayShort } from "@/lib/carriers/accounts";
import { CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { positionOf } from "@/lib/carriers/positions";
import type { CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";
import type { StateCoverage } from "@/lib/coverage";

// Everything about one state under the coverage map: its recruiters, each
// carrier hiring there (and whether that carrier is assigned to the state),
// and every open account with who has it, or "Not assigned".
export function StateCoverageDetail({ c, onClose }: { c: StateCoverage; onClose: () => void }) {
  const { recruiterColor, toggleCarrierOnState } = useCarrierMap();
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [closed, setClosed] = useState<Set<CarrierId>>(new Set());
  const open = c.total - c.assigned;
  const code = STATE_CODE[c.state];

  const toggle = (id: CarrierId) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mt-3 rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
      <div className="flex items-start gap-4 flex-wrap px-4 py-3 border-b border-[var(--cpm-border)]">
        <div>
          <div className="text-[17px] font-bold text-[var(--cpm-text)]">
            {c.state} <span className="text-[var(--cpm-text-faint)] font-semibold text-[13px]">{code}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[12px]">
            <span className="text-[var(--cpm-text-faint)]">Recruiters:</span>
            {c.recruiters.length ? (
              c.recruiters.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded-full font-semibold text-white text-[11.5px]" style={{ background: recruiterColor(r) }}>
                  {r}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-full font-semibold text-[11.5px] bg-[var(--cpm-red-soft)] text-[#ff9a9d] border border-[var(--cpm-red)]">
                No recruiter assigned
              </span>
            )}
          </div>
        </div>
        <div className="flex items-stretch gap-2 ml-auto">
          <Pill label="Open accounts" value={c.total} />
          <Pill label="Assigned" value={c.assigned} color="var(--cpm-green)" />
          <Pill label="Not assigned" value={open} color="#ff8a8e" />
        </div>
        <div className="flex items-center gap-3 w-full">
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--cpm-text-dim)] cursor-pointer">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
            Show only accounts not assigned
          </label>
          <button type="button" onClick={onClose} className="ml-auto text-[12px] font-semibold text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]">
            ✕ Close
          </button>
        </div>
      </div>

      {!c.carriers.length && <div className="px-4 py-6 text-[12.5px] text-[var(--cpm-text-faint)]">No carrier has open accounts in this state.</div>}

      {c.carriers.map((k) => {
        const rows = onlyOpen ? k.accounts.filter((a) => !a.recruiters.length) : k.accounts;
        const isClosed = closed.has(k.carrier);
        const meta = CARRIERS[k.carrier];
        return (
          <div key={k.carrier} className="border-b last:border-b-0 border-[var(--cpm-border)]">
            <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 bg-[var(--cpm-panel-alt)]/40">
              <button type="button" onClick={() => toggle(k.carrier)} className="flex items-center gap-2 text-left">
                <span className="text-[var(--cpm-text-faint)] text-[11px] w-3">{isClosed ? "▶" : "▼"}</span>
                <i className="w-3 h-3 rounded-full inline-block" style={{ background: meta.color }} />
                <span className="text-[14px] font-bold text-[var(--cpm-text)]">{meta.label}</span>
              </button>
              <span className="text-[12px] text-[var(--cpm-text-dim)] tabular-nums">
                <b className="text-[var(--cpm-green)]">{k.assigned}</b> of {k.accounts.length} accounts assigned
                {k.accounts.length - k.assigned > 0 && (
                  <>
                    {" · "}
                    <b className="text-[#ff8a8e]">{k.accounts.length - k.assigned} not assigned</b>
                  </>
                )}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                  k.onState
                    ? "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)] border-[var(--cpm-green)]"
                    : "bg-[var(--cpm-red-soft)] text-[#ff9a9d] border-[var(--cpm-red)]"
                }`}
              >
                {k.onState ? "Carrier assigned to state" : "Carrier not assigned to state"}
              </span>
              <button
                type="button"
                onClick={() => toggleCarrierOnState(c.state, k.carrier)}
                className="ml-auto text-[11.5px] font-semibold px-2.5 py-1 rounded-md border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
              >
                {k.onState ? "Remove carrier from state" : "+ Assign carrier to state"}
              </button>
            </div>
            {!isClosed &&
              (rows.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="text-left text-[10.5px] uppercase tracking-wider text-[var(--cpm-text-faint)]">
                        <th className="px-4 py-1.5 font-semibold">Account</th>
                        <th className="px-3 py-1.5 font-semibold">Position</th>
                        <th className="px-3 py-1.5 font-semibold">Pay</th>
                        <th className="px-3 py-1.5 font-semibold">Home time</th>
                        <th className="px-3 py-1.5 font-semibold">Hiring cities here</th>
                        <th className="px-3 py-1.5 font-semibold w-[170px]">Assigned to</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ account: a, recruiters }) => {
                        const cities = a.cities.filter((x) => x.st === code).map((x) => x.name);
                        return (
                          <tr key={a.id} className="border-t border-[var(--cpm-border)] align-top">
                            <td className="px-4 py-1.5 text-[var(--cpm-text)] font-medium">
                              {a.name}
                              {a.approval === "Yes" && <span className="ml-1.5 text-[10px] font-semibold text-[#f5b84a]">needs approval</span>}
                            </td>
                            <td className="px-3 py-1.5 text-[var(--cpm-text-dim)] whitespace-nowrap">
                              {positionOf(a.carrier, a.cat)}
                              {positionOf(a.carrier, a.cat) !== a.cat && <span className="text-[var(--cpm-text-faint)]"> ({a.cat})</span>}
                            </td>
                            <td className="px-3 py-1.5 text-[var(--cpm-text-dim)]">{formatPayShort(a)}</td>
                            <td className="px-3 py-1.5 text-[var(--cpm-text-dim)]">{a.hometime || "—"}</td>
                            <td className="px-3 py-1.5 text-[var(--cpm-text-dim)]">
                              {cities.length ? cities.join(", ") : a.states.length > 1 ? `${a.states.length} states` : "—"}
                            </td>
                            <td className="px-3 py-1.5">
                              {recruiters.length ? (
                                <span className="flex flex-wrap gap-1">
                                  {recruiters.map((r) => (
                                    <span key={r} className="px-1.5 py-px rounded-full text-[11px] font-semibold text-white" style={{ background: recruiterColor(r) }}>
                                      {r}
                                    </span>
                                  ))}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold px-1.5 py-px rounded bg-[var(--cpm-red-soft)] text-[#ff9a9d] border border-[var(--cpm-red)]">
                                  Not assigned
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-2.5 text-[12px] text-[var(--cpm-text-faint)]">
                  {k.accounts.length ? "Every account here is assigned." : "No open accounts in this state."}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="px-3 py-1.5 rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] min-w-[96px]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">{label}</div>
      <div className="text-[18px] font-bold tabular-nums" style={{ color: color ?? "var(--cpm-text)" }}>
        {value.toLocaleString("en-US")}
      </div>
    </div>
  );
}
