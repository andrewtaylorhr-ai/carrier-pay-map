"use client";

import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { carrierSummaryLines, getStateRecord } from "@/lib/carriers/logic";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { AssignedBadge, RecruiterBadge } from "./badges";

export function DetailCard() {
  const { strategyMode, selectedState, currentCarrier, currentCat, assignments, toggleCarrierOnState, recruiterAssignments, recruiterColor } =
    useCarrierMap();

  if (!selectedState) return null;

  if (strategyMode) {
    const selectedRecruiters = recruiterAssignments[selectedState] || [];
    const summariesHtml = CARRIER_ORDER.map((id) => {
      const lines = carrierSummaryLines(id, selectedState);
      return `<div class="line"><span class="cname" style="color:${CARRIERS[id].color}">${CARRIERS[id].label}:</span> ${
        lines.length ? lines.join(" &nbsp;·&nbsp; ") : '<span class="none">no data for this state</span>'
      }</div>`;
    }).join("");

    return (
      <div id="detail">
        <div className="card">
          <h3>
            {selectedState} <span className="meta">strategy assignment</span>{" "}
            <AssignedBadge carrierIds={assignments[selectedState]} />{" "}
            <RecruiterBadge names={selectedRecruiters} recruiterColor={recruiterColor} />
          </h3>
          <div className="assignRow">
            <label>Carriers:</label>
            <span className="carrierChips">
              {CARRIER_ORDER.map((id) => {
                const on = (assignments[selectedState] || []).includes(id);
                const c = CARRIERS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className={`achip${on ? " selected" : ""}`}
                    onClick={() => toggleCarrierOnState(selectedState, id)}
                    style={on ? { background: c.color, borderColor: c.color, color: "#fff" } : { borderColor: c.color }}
                    title={on ? `Remove ${c.label} from ${selectedState}` : `Add ${c.label} to ${selectedState}`}
                  >
                    {on ? "✓ " : "+ "}
                    {c.label}
                  </button>
                );
              })}
            </span>
          </div>
          <div className="assignRow">
            <label />
            <span style={{ fontSize: 11.5, color: "var(--cpm-text-faint)" }}>
              Click to add or remove — a state can have several carriers.
            </span>
          </div>
          <div className="assignRow">
            <label>Recruiter(s):</label>
            <span style={{ fontSize: 12, color: "var(--cpm-text-faint)" }}>
              Select a recruiter in the panel above and use &quot;Assign states on map&quot; to click-assign territory.
            </span>
          </div>
          <div className="cross">
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
              Quick reference — what each carrier offers here
            </div>
            <div dangerouslySetInnerHTML={{ __html: summariesHtml }} />
          </div>
        </div>
      </div>
    );
  }

  const rec = getStateRecord(currentCarrier, currentCat, selectedState);
  if (!rec) return null;
  return (
    <div id="detail">
      <div className="card">
        <h3>
          {selectedState} — {CARRIERS[currentCarrier].label} · {currentCat}{" "}
          <AssignedBadge carrierIds={assignments[selectedState]} />
        </h3>
        <div dangerouslySetInnerHTML={{ __html: rec.detail }} />
      </div>
    </div>
  );
}
