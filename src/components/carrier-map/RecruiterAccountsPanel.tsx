"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { ALL_ACCOUNTS, accountsInStates, formatPay } from "@/lib/carriers/accounts";
import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import type { Account, CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { recruiterStates } from "@/lib/exportRecruiterReport";

type Scope = "territory" | "all";

// Strategy Builder checklist: tick which carrier accounts the selected
// recruiter should work. Defaults to accounts hiring in the recruiter's
// states, limited to the carriers assigned to those states; managers can
// widen it to every carrier or every state, and search by name/city.
export function RecruiterAccountsPanel() {
  const { strategyMode, recruiterFilter, recruiterAssignments, assignments, recruiterAccounts, toggleRecruiterAccount, setRecruiterAccountsOn } =
    useCarrierMap();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("territory");
  const [assignedCarriersOnly, setAssignedCarriersOnly] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [open, setOpen] = useState<Set<CarrierId>>(new Set());

  const territory = useMemo(
    () => (recruiterFilter ? recruiterStates(recruiterFilter, recruiterAssignments) : []),
    [recruiterFilter, recruiterAssignments]
  );
  const territorySet = useMemo(() => new Set(territory), [territory]);
  const selected = useMemo(() => new Set(recruiterAccounts[recruiterFilter] || []), [recruiterAccounts, recruiterFilter]);
  const anyCarrierAssigned = territory.some((s) => (assignments[s] || []).length);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: Account[] = scope === "all" ? ALL_ACCOUNTS : accountsInStates(territory);
    if (scope === "territory" && assignedCarriersOnly && anyCarrierAssigned) {
      list = list.filter((a) => a.states.some((s) => territorySet.has(s) && (assignments[s] || []).includes(a.carrier)));
    }
    // Always keep already-ticked accounts visible so they can be unticked,
    // even if they've fallen outside the current filters.
    const ids = new Set(list.map((a) => a.id));
    ALL_ACCOUNTS.forEach((a) => {
      if (selected.has(a.id) && !ids.has(a.id)) list = [...list, a];
    });
    if (selectedOnly) list = list.filter((a) => selected.has(a.id));
    if (q) {
      list = list.filter((a) =>
        [a.name, a.cat, CARRIERS[a.carrier].label, ...a.states].some((f) => f.toLowerCase().includes(q))
      );
    }
    return CARRIER_ORDER.map((id) => ({ id, accounts: list.filter((a) => a.carrier === id) })).filter(
      (g) => g.accounts.length
    );
  }, [query, scope, territory, territorySet, assignedCarriersOnly, anyCarrierAssigned, assignments, selected, selectedOnly]);

  if (!strategyMode || !recruiterFilter) return null;

  const total = groups.reduce((n, g) => n + g.accounts.length, 0);
  const isOpen = (id: CarrierId) => open.has(id) || !!query.trim() || groups.length === 1;
  const toggleOpen = (id: CarrierId) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div id="accountChecklist" className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 mb-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
            Carrier accounts for {recruiterFilter}
          </div>
          <div className="text-[12px] text-[var(--cpm-text-dim)] mt-0.5">
            <b className="text-[var(--cpm-text)]">{selected.size}</b> account{selected.size === 1 ? "" : "s"} assigned
            {territory.length ? ` · territory: ${territory.join(", ")}` : " · no states assigned yet"}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)]">
          <Search size={13} className="text-[var(--cpm-text-faint)] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search account, city, state…"
            className="bg-transparent outline-none text-[12.5px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] w-[200px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-3 text-[11.5px] text-[var(--cpm-text-dim)]">
        <div className="checklistSeg">
          <button type="button" className={scope === "territory" ? "active" : undefined} onClick={() => setScope("territory")}>
            In {recruiterFilter}&apos;s states
          </button>
          <button type="button" className={scope === "all" ? "active" : undefined} onClick={() => setScope("all")}>
            All states
          </button>
        </div>
        {scope === "territory" && (
          <label
            className={`flex items-center gap-1.5 select-none ${anyCarrierAssigned ? "cursor-pointer" : "opacity-50"}`}
            title={anyCarrierAssigned ? "" : "No carriers are assigned to these states yet"}
          >
            <input
              type="checkbox"
              checked={assignedCarriersOnly && anyCarrierAssigned}
              disabled={!anyCarrierAssigned}
              onChange={(e) => setAssignedCarriersOnly(e.target.checked)}
              className="accent-[var(--cpm-accent)]"
            />
            Only carriers assigned to these states
          </label>
        )}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(e) => setSelectedOnly(e.target.checked)}
            className="accent-[var(--cpm-accent)]"
          />
          Ticked only
        </label>
        <span className="text-[var(--cpm-text-faint)]">{total} shown</span>
      </div>

      {scope === "territory" && !territory.length ? (
        <div className="text-[12.5px] text-[var(--cpm-text-faint)] py-3">
          Assign states first (&quot;Assign states on map&quot; above), or switch to <b>All states</b> to pick accounts
          directly.
        </div>
      ) : !groups.length ? (
        <div className="text-[12.5px] text-[var(--cpm-text-faint)] py-3">No accounts match.</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
          {groups.map(({ id, accounts }) => {
            const c = CARRIERS[id];
            const ticked = accounts.filter((a) => selected.has(a.id)).length;
            const expanded = isOpen(id);
            return (
              <div key={id} className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleOpen(id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {expanded ? (
                      <ChevronDown size={14} className="text-[var(--cpm-text-dim)] shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-[var(--cpm-text-dim)] shrink-0" />
                    )}
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-[13px] font-semibold text-[var(--cpm-text)]">{c.label}</span>
                    <span className="text-[11.5px] text-[var(--cpm-text-faint)]">
                      {ticked} / {accounts.length} ticked
                    </span>
                  </button>
                  <button
                    type="button"
                    className="checklistBtn"
                    onClick={() => setRecruiterAccountsOn(recruiterFilter, accounts.map((a) => a.id), true)}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="checklistBtn"
                    disabled={!ticked}
                    onClick={() => setRecruiterAccountsOn(recruiterFilter, accounts.map((a) => a.id), false)}
                  >
                    Clear
                  </button>
                </div>
                {expanded && (
                  <div className="border-t border-[var(--cpm-border)]">
                    {accounts.map((a) => {
                      const on = selected.has(a.id);
                      const inTerritory = a.states.filter((s) => territorySet.has(s));
                      return (
                        <label
                          key={a.id}
                          className={`flex items-start gap-2.5 px-3 py-1.5 cursor-pointer text-[12.5px] border-b border-[var(--cpm-border)] last:border-b-0 ${
                            on ? "bg-[rgba(255,255,255,0.04)]" : "hover:bg-[rgba(255,255,255,0.02)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleRecruiterAccount(recruiterFilter, a.id)}
                            className="accent-[var(--cpm-accent)] w-3.5 h-3.5 mt-0.5 shrink-0"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold ${on ? "text-[var(--cpm-text)]" : "text-[var(--cpm-text-dim)]"}`}>
                                {a.name}
                              </span>
                              <span className="catTag">{a.cat}</span>
                              {a.approval === "Yes" && <span className="apprBadge">needs approval</span>}
                              {a.sob && <span className="sobTag">{a.sob}</span>}
                            </span>
                            <span className="block text-[11.5px] text-[var(--cpm-text-faint)] mt-0.5">
                              {formatPay(a)}
                              {a.hometime ? ` · ${a.hometime}` : ""}
                            </span>
                            <span className="block text-[11px] text-[var(--cpm-text-faint)]">
                              {inTerritory.length ? (
                                <>
                                  <b className="text-[var(--cpm-text-dim)]">{inTerritory.join(", ")}</b>
                                  {a.states.length > inTerritory.length ? ` +${a.states.length - inTerritory.length} more` : ""}
                                </>
                              ) : (
                                <>Hires in {a.states.length > 6 ? `${a.states.length} states` : a.states.join(", ")}</>
                              )}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
