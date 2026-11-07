"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ALL_ACCOUNTS } from "@/lib/carriers/accounts";
import { CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";

const ACCOUNT_BY_ID = new Map(ALL_ACCOUNTS.map((a) => [a.id, a]));

// Offboarding step shown when a recruiter is marked as left: lists the states
// and accounts they still hold and moves them to another active recruiter in
// one click, or leaves them unassigned so the coverage map shows the gap.
export function HandOverDialog({ from, onClose }: { from: string; onClose: () => void }) {
  const { recruiters, recruiterAssignments, recruiterAccounts, recruiterColor, getRecruiterStatus, handOverRecruiter } = useCarrierMap();
  const [to, setTo] = useState("");

  const states = useMemo(
    () => Object.entries(recruiterAssignments).filter(([, arr]) => arr.includes(from)).map(([s]) => s).sort(),
    [recruiterAssignments, from]
  );
  const accountIds = useMemo(() => [...new Set(recruiterAccounts[from] ?? [])], [recruiterAccounts, from]);
  const byCarrier = useMemo(
    () =>
      CARRIER_ORDER.map((id) => ({
        id,
        names: accountIds.map((x) => ACCOUNT_BY_ID.get(x)).filter((a) => a?.carrier === id).map((a) => a!.name),
      })).filter((g) => g.names.length),
    [accountIds]
  );
  const candidates = recruiters.filter((r) => r !== from && getRecruiterStatus(r) === "active");
  const holdsNothing = !states.length && !accountIds.length;

  const confirm = () => {
    handOverRecruiter(from, to || null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Offboard ${from}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] max-h-[85vh] flex flex-col rounded-xl border border-[var(--cpm-border-strong)] bg-[var(--cpm-bg)] shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-[var(--cpm-border)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: recruiterColor(from) }} />
            <h2 className="text-[16px] font-bold text-[var(--cpm-text)]">Offboard {from}</h2>
          </div>
          <p className="mt-1 text-[12.5px] text-[var(--cpm-text-dim)]">
            {from} will be marked as a former recruiter. Their plans and results stay in Reports.
          </p>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
          {holdsNothing ? (
            <p className="text-[12.5px] text-[var(--cpm-text-faint)]">{from} has no states or accounts to hand over.</p>
          ) : (
            <>
              <section>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1.5">
                  States ({states.length})
                </div>
                {states.length ? (
                  <div className="flex flex-wrap gap-1">
                    {states.map((s) => (
                      <span key={s} title={s} className="text-[11px] font-semibold px-1.5 py-px rounded bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                        {STATE_CODE[s] ?? s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-[var(--cpm-text-faint)]">No states.</div>
                )}
              </section>
              <section>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1.5">
                  Accounts ({accountIds.length})
                </div>
                {byCarrier.length ? (
                  <div className="flex flex-col gap-2">
                    {byCarrier.map((g) => (
                      <details key={g.id} className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)]">
                        <summary className="cursor-pointer px-3 py-1.5 text-[12.5px] font-semibold text-[var(--cpm-text)] flex items-center gap-2">
                          <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CARRIERS[g.id].color }} />
                          {CARRIERS[g.id].label}
                          <span className="text-[var(--cpm-text-faint)] font-normal">{g.names.length}</span>
                        </summary>
                        <ul className="px-3 pb-2 pl-7 text-[12px] text-[var(--cpm-text-dim)] list-disc">
                          {g.names.map((n, i) => (
                            <li key={`${n}-${i}`}>{n}</li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-[var(--cpm-text-faint)]">No accounts.</div>
                )}
              </section>
              <section>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1.5" htmlFor="handOverTo">
                  Hand over to
                </label>
                <select
                  id="handOverTo"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[13px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
                >
                  <option value="">Nobody, leave them unassigned</option>
                  {candidates.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11.5px] text-[var(--cpm-text-faint)]">
                  {to
                    ? `${to} gets all ${states.length} states and ${accountIds.length} accounts, added to what they already have.`
                    : "They will show as not assigned on the coverage map until you give them to someone."}
                </p>
              </section>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--cpm-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 h-8 rounded-lg text-[12.5px] font-semibold border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            className="px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)]"
          >
            {holdsNothing ? "Mark as left" : to ? `Mark as left and hand over to ${to}` : "Mark as left"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
