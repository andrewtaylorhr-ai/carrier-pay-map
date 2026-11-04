"use client";

import { accountDetailHtml } from "@/lib/carriers/logic";
import { CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import {
  exportAllRecruitersToExcel,
  exportRecruiterReportToExcel,
  recruiterAssignedAccounts,
  recruiterStates,
} from "@/lib/exportRecruiterReport";
import { AssignedBadge, RecruiterBadge } from "./badges";

// What the selected recruiter will receive: per state, the carriers assigned
// there and the accounts ticked for them in the checklist above — the same
// content as the Excel download.
export function RecruiterReport() {
  const { strategyMode, recruiterFilter, recruiters, recruiterAssignments, recruiterAccounts, assignments, recruiterColor } =
    useCarrierMap();
  if (!strategyMode || !recruiterFilter) return null;

  const states = recruiterStates(recruiterFilter, recruiterAssignments);
  const accounts = recruiterAssignedAccounts(recruiterFilter, recruiterAccounts);
  const stateSet = new Set(states);
  const outside = accounts.filter((a) => !a.states.some((s) => stateSet.has(s)));

  const exportButtons = (
    <>
      <button
        type="button"
        className="exportBtn"
        onClick={() => exportRecruiterReportToExcel(recruiterFilter, assignments, recruiterAssignments, recruiterAccounts)}
      >
        ⬇ Export {recruiterFilter} to Excel
      </button>
      <button
        type="button"
        className="exportBtn"
        onClick={() => exportAllRecruitersToExcel(recruiters, assignments, recruiterAssignments, recruiterAccounts)}
        title="One workbook: a Summary sheet plus one sheet per recruiter"
      >
        ⬇ Export all recruiters
      </button>
    </>
  );

  if (!states.length && !accounts.length) {
    return (
      <div id="recruiterReport">
        <h2>
          {recruiterFilter} — strategy report {exportButtons}
        </h2>
        <p className="none">No states or accounts assigned yet.</p>
      </div>
    );
  }

  return (
    <div id="recruiterReport">
      <h2>
        {recruiterFilter} — strategy report ({states.length} state{states.length === 1 ? "" : "s"}, {accounts.length}{" "}
        account{accounts.length === 1 ? "" : "s"}) {exportButtons}
      </h2>
      {!accounts.length && (
        <p className="none" style={{ marginBottom: 8 }}>
          No accounts ticked yet — the Excel file will list every open account in these states for the carriers
          assigned to each state. Tick accounts in the checklist above to send only those.
        </p>
      )}
      {states.map((state) => {
        const here = accounts.filter((a) => a.states.includes(state));
        return (
          <div className="card" key={state}>
            <h3>
              {state} <AssignedBadge carrierIds={assignments[state]} />{" "}
              <RecruiterBadge names={recruiterAssignments[state] || []} recruiterColor={recruiterColor} />
            </h3>
            {here.length ? (
              here.map((a) => (
                <div key={a.id}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: CARRIERS[a.carrier].color, marginTop: 6 }}>
                    {CARRIERS[a.carrier].label} · {a.cat}
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: accountDetailHtml(a) }} />
                </div>
              ))
            ) : (
              <p className="none">No accounts ticked in this state.</p>
            )}
          </div>
        );
      })}
      {outside.length > 0 && (
        <div className="card">
          <h3>Accounts outside {recruiterFilter}&apos;s states</h3>
          {outside.map((a) => (
            <div key={a.id}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: CARRIERS[a.carrier].color, marginTop: 6 }}>
                {CARRIERS[a.carrier].label} · {a.cat} · hires in {a.states.join(", ")}
              </div>
              <div dangerouslySetInnerHTML={{ __html: accountDetailHtml(a) }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
