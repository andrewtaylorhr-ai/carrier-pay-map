"use client";

import { useEffect, useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { RECRUITER_TARGET } from "@/lib/recruiters";

const NOTES_MAX = 500;

// The editable "Strategy Plan" for whichever recruiter is currently selected
// in RecruiterPanel (reuses that same click-to-filter selection instead of
// adding a second way to pick a recruiter). State assignment happens by
// putting the map itself into "assign mode" — click a recruiter's plan
// open, hit "Assign states on map", then click through their territory
// directly on the choropleth.
//
// Monthly targets + notes are edited as a local draft and only persisted to
// recruiterPlans when "Save" is clicked (matches the reference dashboard
// mockup's explicit Save button, replacing the old instant-save-on-change /
// save-on-blur behavior). The "Carriers this recruiter works" list now
// lives in its own AssignedCarriersPanel component, rendered alongside this
// one — it still reads/writes the exact same plan.carriers data.
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
  const [submissionsDraft, setSubmissionsDraft] = useState(plan.targetSubmissions);
  const [hiresDraft, setHiresDraft] = useState(plan.targetHires);
  const [notesDraft, setNotesDraft] = useState(plan.notes);
  const [justSaved, setJustSaved] = useState(false);

  // Keep drafts in sync when the selected recruiter (or their underlying
  // plan) changes — e.g. switching recruiters, or a fresh save landing.
  useEffect(() => {
    setSubmissionsDraft(plan.targetSubmissions);
    setHiresDraft(plan.targetHires);
    setNotesDraft(plan.notes);
    setJustSaved(false);
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

  const dirty = submissionsDraft !== plan.targetSubmissions || hiresDraft !== plan.targetHires || notesDraft !== plan.notes;

  const handleSave = () => {
    updateRecruiterPlan(recruiterFilter, {
      targetSubmissions: submissionsDraft,
      targetHires: hiresDraft,
      notes: notesDraft,
    });
    setJustSaved(true);
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
                value={submissionsDraft ?? ""}
                placeholder="—"
                onChange={(e) => {
                  setSubmissionsDraft(e.target.value === "" ? null : Number(e.target.value));
                  setJustSaved(false);
                }}
              />
            </label>
            <label>
              Hires
              <input
                type="number"
                min={0}
                value={hiresDraft ?? ""}
                placeholder="—"
                onChange={(e) => {
                  setHiresDraft(e.target.value === "" ? null : Number(e.target.value));
                  setJustSaved(false);
                }}
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

        <div className="spSection spNotes">
          <div className="spLabel">Goals / notes</div>
          <textarea
            value={notesDraft}
            maxLength={NOTES_MAX}
            placeholder="Focus states, priorities, anything worth remembering for this recruiter…"
            onChange={(e) => {
              setNotesDraft(e.target.value);
              setJustSaved(false);
            }}
          />
          <span className="spCharCount">
            {notesDraft.length}/{NOTES_MAX}
          </span>
          <div className="spSaveRow">
            <button type="button" className="spSaveBtn" onClick={handleSave} disabled={!dirty}>
              Save
            </button>
            {justSaved && !dirty && <span className="spSavedHint">✓ Saved</span>}
          </div>
        </div>
      </div>

      <div className="spQuickTips">
        <div className="spQtTitle">Quick tips</div>
        <ul>
          <li>Click a state on the map, or in the Select State list, to see its full detail.</li>
          <li>Use &quot;Assign states on map&quot; to click-build this recruiter&apos;s territory.</li>
          <li>Targets and notes save together — click Save when you&apos;re happy with your changes.</li>
        </ul>
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
