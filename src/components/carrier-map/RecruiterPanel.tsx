"use client";

import { ALL_STATES } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { RECRUITER_TARGET } from "@/lib/recruiters";

export function RecruiterPanel() {
  const { strategyMode, recruiters, recruiterColor, recruiterAssignments, recruiterFilter, setRecruiterFilter } =
    useCarrierMap();
  if (!strategyMode) return null;

  const counts: Record<string, number> = {};
  recruiters.forEach((r) => (counts[r] = 0));
  Object.values(recruiterAssignments).forEach((arr) => {
    (arr || []).forEach((r) => {
      if (counts[r] != null) counts[r]++;
    });
  });

  const unassignedCount =
    ALL_STATES.length - Object.keys(recruiterAssignments).filter((s) => recruiterAssignments[s]?.length).length;

  return (
    <div id="recruiterPanel">
      <span className="rhint">Click a recruiter to filter the map + see their full report:</span>
      {recruiters.map((r) => (
        <span
          key={r}
          className={`rchip${counts[r] > RECRUITER_TARGET ? " over" : ""}${recruiterFilter === r ? " selected" : ""}`}
          onClick={() => setRecruiterFilter(recruiterFilter === r ? "" : r)}
        >
          <span className="dot" style={{ background: recruiterColor(r) }} />
          {r}: {counts[r]}
        </span>
      ))}
      <span className="rchip" style={{ color: "#6b7280", cursor: "default" }}>
        Unassigned: {unassignedCount}
      </span>
      {recruiterFilter && (
        <span className="rchip" style={{ color: "#ff9a9d", borderColor: "rgba(229,72,77,.45)" }} onClick={() => setRecruiterFilter("")}>
          ✕ Clear filter
        </span>
      )}
    </div>
  );
}
