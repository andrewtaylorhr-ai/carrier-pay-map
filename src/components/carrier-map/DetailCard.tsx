"use client";

import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { carrierSummaryLines, getStateRecord } from "@/lib/carriers/logic";
import type { CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { AssignedBadge, RecruiterBadge } from "./badges";

export function DetailCard() {
  const {
    strategyMode,
    selectedState,
    currentCarrier,
    currentCat,
    assignments,
    assignCarrierToState,
    recruiterAssignments,
    recruiters,
    recruiterColor,
    toggleRecruiterOnState,
  } = useCarrierMap();

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
            <AssignedBadge carrierId={assignments[selectedState]} />{" "}
            <RecruiterBadge names={selectedRecruiters} recruiterColor={recruiterColor} />
          </h3>
          <div className="assignRow">
            <label>Carrier:</label>
            <select
              value={assignments[selectedState] ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                assignCarrierToState(selectedState, v ? (v as CarrierId) : null);
              }}
            >
              <option value="">— Unassigned —</option>
              {CARRIER_ORDER.map((id) => (
                <option key={id} value={id}>
                  {CARRIERS[id].label}
                </option>
              ))}
            </select>
          </div>
          <div className="assignRow">
            <label>Recruiter(s):</label>
            <div className="assignChips">
              {recruiters.map((r) => {
                const on = selectedRecruiters.includes(r);
                return (
                  <span
                    key={r}
                    className={`achip${on ? " selected" : ""}`}
                    style={on ? { background: recruiterColor(r), borderColor: recruiterColor(r) } : undefined}
                    onClick={() => toggleRecruiterOnState(selectedState, r)}
                  >
                    {r}
                  </span>
                );
              })}
            </div>
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
          <AssignedBadge carrierId={assignments[selectedState]} />
        </h3>
        <div dangerouslySetInnerHTML={{ __html: rec.detail }} />
      </div>
    </div>
  );
}
