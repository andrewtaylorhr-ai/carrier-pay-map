"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";

export function RecruiterManage() {
  const { strategyMode, recruiters, recruiterColor, addRecruiter, removeRecruiter } = useCarrierMap();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  if (!strategyMode) return null;

  const doAdd = () => {
    const problem = addRecruiter(name);
    if (problem) {
      setErr(problem);
      return;
    }
    setName("");
    setErr("");
  };

  return (
    <div id="recruiterManage">
      <div className="rmHeader">
        <span className="rmTitle">Recruiters</span>
        <span className="rmHint">Add new hires or remove recruiters who&apos;ve left — updates the map + report instantly.</span>
      </div>
      <div className="rmChips">
        {recruiters.map((r) => (
          <span key={r} className="rmChip">
            <span className="dot" style={{ background: recruiterColor(r) }} />
            {r}
            <button
              type="button"
              className="rmRemove"
              title={`Remove ${r}`}
              onClick={() => {
                if (!confirm(`Remove ${r}? Their state assignments will be cleared.`)) return;
                removeRecruiter(r);
              }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="rmAddRow">
        <input
          type="text"
          placeholder="New recruiter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doAdd();
            }
          }}
        />
        <button type="button" className="rmAddBtn" onClick={doAdd}>
          + Add recruiter
        </button>
        <span className="rmErr">{err}</span>
      </div>
    </div>
  );
}
