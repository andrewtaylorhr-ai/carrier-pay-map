"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { formatMonthLabel } from "@/lib/recruiters";

// Sidebar-resident month switcher for the /reports page's Monthly Report
// card. Previously the month list lived as a row of pills inside the card
// header, which only had room for 2-3 months before overflowing/cutting off
// (see the "Aug 202…" clipping the user flagged). Moved here, into the
// sidebar space that's otherwise empty on every route but Dashboard (which
// shows RecruiterManage in the same slot) — same reportsActiveMonth /
// updateMonthlyReport plumbing as before, just relocated so the list has
// room to grow to a full year of months without crowding the report itself.
export function ReportsMonthNav() {
  const { monthlyReports, updateMonthlyReport, reportsActiveMonth, setReportsActiveMonth } = useCarrierMap();
  const monthKeys = Object.keys(monthlyReports).sort().reverse();
  const activeMonth =
    reportsActiveMonth && monthlyReports[reportsActiveMonth] ? reportsActiveMonth : monthKeys[0] ?? "";
  const [newMonthInput, setNewMonthInput] = useState("");

  const handleAddMonth = () => {
    if (!newMonthInput || monthlyReports[newMonthInput]) return;
    updateMonthlyReport(newMonthInput, {});
    setReportsActiveMonth(newMonthInput);
    setNewMonthInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">
        Monthly report
      </div>

      <div className="flex flex-col gap-0.5">
        {monthKeys.length === 0 ? (
          <div className="px-3 py-2 text-[12px] text-[var(--cpm-text-faint)] italic">No months yet.</div>
        ) : (
          monthKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setReportsActiveMonth(key)}
              className={`flex items-center px-3 h-8 rounded-lg text-[13px] font-semibold text-left transition-colors ${
                activeMonth === key
                  ? "bg-[var(--cpm-accent)] text-[#241800]"
                  : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:bg-[var(--cpm-panel)]"
              }`}
            >
              {formatMonthLabel(key)}
            </button>
          ))
        )}
      </div>

      <div className="flex items-center gap-1 px-1 pt-1">
        <input
          type="month"
          value={newMonthInput}
          onChange={(e) => setNewMonthInput(e.target.value)}
          className="h-7 flex-1 min-w-0 bg-[var(--cpm-panel)] border border-[var(--cpm-border)] rounded px-1.5 text-[11.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
        />
        <button
          type="button"
          onClick={handleAddMonth}
          disabled={!newMonthInput || !!monthlyReports[newMonthInput]}
          title="Add month"
          className="flex items-center justify-center w-7 h-7 shrink-0 rounded-md bg-[var(--cpm-panel)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)] transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
