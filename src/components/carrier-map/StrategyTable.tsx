"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ACCOUNTS_BY_ID, carrierAccounts } from "@/lib/carriers/accounts";
import { ALL_STATES, CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { exportRecruiterReportToExcel, recruiterStates } from "@/lib/exportRecruiterReport";
import { RecruiterBadge } from "./badges";

type Tab = "state" | "recruiter";

// Manager's overview of the whole strategy in table form: by state (toggle
// carriers on/off right in the row, see who covers it and how many accounts
// are ticked there) or by recruiter (states, carriers, accounts, download).
export function StrategyTable() {
  const {
    strategyMode,
    assignments,
    toggleCarrierOnState,
    recruiters,
    recruiterAssignments,
    recruiterAccounts,
    recruiterColor,
    setSelectedState,
    setRecruiterFilter,
    getRecruiterStatus,
    compareRecruitersByStatus,
    showFormer,
  } = useCarrierMap();
  const [tab, setTab] = useState<Tab>("state");
  const [query, setQuery] = useState("");
  const [assignedOnly, setAssignedOnly] = useState(false);

  // state -> recruiter -> # of that recruiter's ticked accounts hiring there
  const tickedByState = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    Object.entries(recruiterAccounts).forEach(([r, ids]) => {
      ids.forEach((id) => {
        const a = ACCOUNTS_BY_ID.get(id);
        a?.states.forEach((s) => {
          out[s] = out[s] || {};
          out[s][r] = (out[s][r] || 0) + 1;
        });
      });
    });
    return out;
  }, [recruiterAccounts]);

  const states = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...ALL_STATES].sort();
    if (q) list = list.filter((s) => s.toLowerCase().includes(q));
    if (assignedOnly) list = list.filter((s) => (assignments[s] || []).length || (recruiterAssignments[s] || []).length);
    return list;
  }, [query, assignedOnly, assignments, recruiterAssignments]);

  const recruiterRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recruiters
      .filter((r) => (showFormer || getRecruiterStatus(r) !== "inactive") && (!q || r.toLowerCase().includes(q)))
      .slice()
      .sort(compareRecruitersByStatus)
      .map((r) => {
        const st = recruiterStates(r, recruiterAssignments);
        const carriers = CARRIER_ORDER.filter((id) => st.some((s) => (assignments[s] || []).includes(id)));
        const accounts = (recruiterAccounts[r] || []).filter((id) => ACCOUNTS_BY_ID.has(id));
        return { r, st, carriers, accounts: accounts.length };
      })
      .filter((row) => !assignedOnly || row.st.length || row.accounts);
  }, [query, assignedOnly, recruiters, recruiterAssignments, recruiterAccounts, assignments, compareRecruitersByStatus, showFormer, getRecruiterStatus]);

  if (!strategyMode) return null;

  return (
    <div id="strategyTable" className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 mb-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
            Strategy table
          </div>
          <div className="checklistSeg">
            <button type="button" className={tab === "state" ? "active" : undefined} onClick={() => setTab("state")}>
              By state
            </button>
            <button type="button" className={tab === "recruiter" ? "active" : undefined} onClick={() => setTab("recruiter")}>
              By recruiter
            </button>
          </div>
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
              placeholder={tab === "state" ? "Search state…" : "Search recruiter…"}
              className="bg-transparent outline-none text-[12px] text-[var(--cpm-text)] placeholder:text-[var(--cpm-text-faint)] w-[130px]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[460px]">
        {tab === "state" ? (
          <table className="strategyGrid">
            <thead>
              <tr>
                <th>State</th>
                <th>Carriers (click to add / remove)</th>
                <th>Recruiters</th>
                <th>Accounts ticked</th>
              </tr>
            </thead>
            <tbody>
              {states.map((s) => {
                const ticked = tickedByState[s] || {};
                const tickedTotal = Object.values(ticked).reduce((n, v) => n + v, 0);
                return (
                  <tr key={s}>
                    <td>
                      <button type="button" className="stateLink" onClick={() => setSelectedState(s)}>
                        {s}
                      </button>
                    </td>
                    <td>
                      <span className="carrierChips">
                        {CARRIER_ORDER.map((id) => {
                          const on = (assignments[s] || []).includes(id);
                          const open = carrierAccounts(id, undefined, s).length;
                          const c = CARRIERS[id];
                          return (
                            <button
                              key={id}
                              type="button"
                              className={`achip mini${on ? " selected" : ""}`}
                              onClick={() => toggleCarrierOnState(s, id)}
                              style={
                                on
                                  ? { background: c.color, borderColor: c.color, color: "#fff" }
                                  : { borderColor: open ? c.color : "var(--cpm-border)", opacity: open ? 1 : 0.45 }
                              }
                              title={`${c.label}: ${open} open account${open === 1 ? "" : "s"} hiring in ${s}`}
                            >
                              {c.label}
                              <span className="chipCount">{open}</span>
                            </button>
                          );
                        })}
                      </span>
                    </td>
                    <td>
                      <RecruiterBadge names={recruiterAssignments[s] || []} recruiterColor={recruiterColor} />
                    </td>
                    <td className="tabular-nums">
                      {tickedTotal ? (
                        <span title={Object.entries(ticked).map(([r, n]) => `${r}: ${n}`).join("\n")}>
                          {tickedTotal}{" "}
                          <span className="text-[var(--cpm-text-faint)]">
                            ({Object.keys(ticked).length} recruiter{Object.keys(ticked).length === 1 ? "" : "s"})
                          </span>
                        </span>
                      ) : (
                        <span className="text-[var(--cpm-text-faint)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!states.length && (
                <tr>
                  <td colSpan={4} className="text-center italic text-[var(--cpm-text-faint)] py-4">
                    No states match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="strategyGrid">
            <thead>
              <tr>
                <th>Recruiter</th>
                <th>States</th>
                <th>Carriers</th>
                <th>Accounts</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recruiterRows.map(({ r, st, carriers, accounts }) => (
                <tr key={r}>
                  <td>
                    <button
                      type="button"
                      className="stateLink"
                      onClick={() => setRecruiterFilter(r)}
                      style={getRecruiterStatus(r) === "inactive" ? { color: "#ff9a9d" } : undefined}
                    >
                      <span className="dot" style={{ background: recruiterColor(r) }} /> {r}
                    </button>
                  </td>
                  <td className="text-[var(--cpm-text-dim)]">{st.length ? st.join(", ") : <span className="none">none</span>}</td>
                  <td>
                    {carriers.length ? (
                      <span className="carrierChips">
                        {carriers.map((id) => (
                          <span key={id} className="assignBadge" style={{ background: CARRIERS[id].color }}>
                            {CARRIERS[id].label}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="none">none</span>
                    )}
                  </td>
                  <td className="tabular-nums">{accounts || <span className="none">0</span>}</td>
                  <td>
                    <button
                      type="button"
                      className="checklistBtn"
                      disabled={!st.length && !accounts}
                      onClick={() => exportRecruiterReportToExcel(r, assignments, recruiterAssignments, recruiterAccounts)}
                    >
                      ⬇ Excel
                    </button>
                  </td>
                </tr>
              ))}
              {!recruiterRows.length && (
                <tr>
                  <td colSpan={5} className="text-center italic text-[var(--cpm-text-faint)] py-4">
                    No recruiters match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="text-[10.5px] text-[var(--cpm-text-faint)] mt-2">
        Number on each carrier = open accounts hiring in that state. Click a recruiter to open their account checklist.
      </div>
    </div>
  );
}
