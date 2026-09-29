"use client";

import { useEffect, useState } from "react";
import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import type { CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { RECRUITER_TARGET } from "@/lib/recruiters";

// The editable "Strategy Plan" for whichever recruiter is currently selected
// in RecruiterPanel (reuses that same click-to-filter selection instead of
// adding a second way to pick a recruiter). Replaces the old one-state-at-a-
// time recruiter checkboxes that used to live in DetailCard: state
// assignment now happens by putting the map itself into "assign mode" —
// click a recruiter's plan open, hit "Assign states on map", then click
// through their territory directly on the choropleth.
export function RecruiterStrategyPlan() {
  const {
    strategyMode,
    recruiterFilter,
    recruiterAssignments,
    recruiterColor,
    getRecruiterPlan,
    updateRecruiterPlan,
    assignModeRecruiter,
    setAssignModeRecruiter,
    setColorMode,
  } = useCarrierMap();

  const plan = getRecruiterPlan(recruiterFilter);
  const [notesDraft, setNotesDraft] = useState(plan.notes);

  // Keep the notes textarea's draft in sync when the selected recruiter changes.
  useEffect(() => {
    setNotesDraft(plan.notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiterFilter]);

  // Auto-exit assign mode if it's left pointing at a recruiter that's no
  // longer selected, or if Strategy mode gets turned off entirely.
  useEffect(() => {
    if (assignModeRecruiter && (!strategyMode || assignModeRecruiter !== recruiterFilter)) {
      setAssignModeRecruiter(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategyMode, recruiterFilter]);

  if (!strategyMode || !recruiterFilter) return null;

  const states = Object.keys(recruiterAssignments)
    .filter((s) => (recruiterAssignments[s] || []).includes(recruiterFilter))
    .sort();
  const assigning = assignModeRecruiter === recruiterFilter;

  const toggleAssignMode = () => {
    if (assigning) {
      setAssignModeRecruiter(null);
    } else {
      setColorMode("recruiter");
      setAssignModeRecruiter(recruiterFilter);
    }
  };

  const toggleCarrierTag = (id: CarrierId) => {
    const has = plan.carriers.includes(id);
    updateRecruiterPlan(recruiterFilter, {
      carriers: has ? plan.carriers.filter((c) => c !== id) : [...plan.carriers, id],
    });
  };

  return (
    <div id="strategyPlan">
      <div className="spHeader">
        <span className="dot" style={{ background: recruiterColor(recruiterFilter) }} />
        <span className="spTitle">{recruiterFilter} — Strategy Plan</span>
      </div>

      <div className="spGrid">
        <div className="spSection">
          <div className="spLabel">Monthly target</div>
          <div className="spTargetRow">
            <label>
              Submissions
              <input
                type="number"
                min={0}
                value={plan.targetSubmissions ?? ""}
                placeholder="—"
                onChange={(e) =>
                  updateRecruiterPlan(recruiterFilter, {
                    targetSubmissions: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Hires
              <input
                type="number"
                min={0}
                value={plan.targetHires ?? ""}
                placeholder="—"
                onChange={(e) =>
                  updateRecruiterPlan(recruiterFilter, {
                    targetHires: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        </div>

        <div className="spSection">
          <div className="spLabel">
            States assigned — {states.length}
            {states.length > RECRUITER_TARGET ? " (over target)" : ""}
          </div>
          <div className="spStates">
            {states.length ? states.join(", ") : <span className="none">No states assigned yet.</span>}
          </div>
          <button type="button" className={`spAssignBtn${assigning ? " active" : ""}`} onClick={toggleAssignMode}>
            {assigning ? "✓ Done — click states on the map" : "Assign states on map"}
          </button>
        </div>

        <div className="spSection">
          <div className="spLabel">Carriers this recruiter works</div>
          <div className="spCarrierTags">
            {CARRIER_ORDER.map((id) => {
              const on = plan.carriers.includes(id);
              return (
                <span
                  key={id}
                  className={`spCarrierTag${on ? " selected" : ""}`}
                  style={on ? { background: CARRIERS[id].color, borderColor: CARRIERS[id].color, color: "#241800" } : undefined}
                  onClick={() => toggleCarrierTag(id)}
                >
                  {CARRIERS[id].label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="spSection spNotes">
          <div className="spLabel">Goals / notes</div>
          <textarea
            value={notesDraft}
            placeholder="Focus states, priorities, anything worth remembering for this recruiter…"
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => {
              if (notesDraft !== plan.notes) updateRecruiterPlan(recruiterFilter, { notes: notesDraft });
            }}
          />
        </div>
      </div>

      {assigning && (
        <div className="spAssignBanner">
          Assigning states to <strong>{recruiterFilter}</strong> — click states on the map below to add or remove them,
          click again to toggle. Click &quot;Done&quot; above when finished.
        </div>
      )}
    </div>
  );
}
