"use client";

import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { getStateRecord } from "@/lib/carriers/logic";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { exportRecruiterReportToExcel } from "@/lib/exportRecruiterReport";
import { AssignedBadge, RecruiterBadge } from "./badges";

export function RecruiterReport() {
  const { strategyMode, recruiterFilter, recruiterAssignments, assignments, recruiterColor } = useCarrierMap();
  if (!strategyMode || !recruiterFilter) return null;

  const states = Object.keys(recruiterAssignments)
    .filter((s) => (recruiterAssignments[s] || []).includes(recruiterFilter))
    .sort();

  if (!states.length) {
    return (
      <div id="recruiterReport">
        <h2>{recruiterFilter} — full report</h2>
        <p className="none">No states assigned yet.</p>
      </div>
    );
  }

  return (
    <div id="recruiterReport">
      <h2>
        {recruiterFilter} — full report ({states.length} state{states.length > 1 ? "s" : ""})
        <button
          type="button"
          className="exportBtn"
          onClick={() => exportRecruiterReportToExcel(recruiterFilter, assignments, recruiterAssignments)}
        >
          ⬇ Export to Excel
        </button>
      </h2>
      {states.map((state) => {
        const carrierBlocksHtml = CARRIER_ORDER.map((id) => {
          const cats = CARRIERS[id].cats;
          const catBlocks = cats
            .map((cat) => {
              const rec = getStateRecord(id, cat, state);
              if (!rec) return "";
              return `<div style="margin:4px 0 10px"><div style="font-size:12px;font-weight:600;color:#9aa0ad">${cat}</div>${rec.detail}</div>`;
            })
            .filter(Boolean)
            .join("");
          if (!catBlocks) return "";
          return `<div style="margin:10px 0"><div style="font-weight:700;font-size:13px;color:${CARRIERS[id].color}">${CARRIERS[id].label}</div>${catBlocks}</div>`;
        })
          .filter(Boolean)
          .join("");

        return (
          <div className="card" key={state}>
            <h3>
              {state} <AssignedBadge carrierId={assignments[state]} />{" "}
              <RecruiterBadge names={recruiterAssignments[state] || []} recruiterColor={recruiterColor} />
            </h3>
            {carrierBlocksHtml ? (
              <div dangerouslySetInnerHTML={{ __html: carrierBlocksHtml }} />
            ) : (
              <p className="none">No carrier data available for this state.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
