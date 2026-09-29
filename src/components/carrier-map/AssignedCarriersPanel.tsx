"use client";

import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import type { CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";

// Restyle of the old "Carriers this recruiter works" pill-tag list as a
// checkbox list, per the reference mockup. Same underlying data/handler as
// before (plan.carriers / updateRecruiterPlan) — purely a visual swap, not a
// new feature. "Manage Carriers" has no backing feature (carriers are
// hardcoded data, not a manageable roster like recruiters), so it stays a
// disabled "coming soon" affordance rather than being wired to anything.
export function AssignedCarriersPanel() {
  const { strategyMode, recruiterFilter, getRecruiterPlan, updateRecruiterPlan } = useCarrierMap();
  if (!strategyMode || !recruiterFilter) return null;

  const plan = getRecruiterPlan(recruiterFilter);

  const toggleCarrier = (id: CarrierId) => {
    const has = plan.carriers.includes(id);
    updateRecruiterPlan(recruiterFilter, {
      carriers: has ? plan.carriers.filter((c) => c !== id) : [...plan.carriers, id],
    });
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 w-[240px] shrink-0 flex flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2.5">
        Assigned carriers
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        {CARRIER_ORDER.map((id) => {
          const checked = plan.carriers.includes(id);
          return (
            <label
              key={id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[12.5px] text-[var(--cpm-text)] hover:bg-[var(--cpm-panel-alt)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCarrier(id)}
                className="accent-[var(--cpm-accent)] w-3.5 h-3.5"
              />
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CARRIERS[id].color }} />
              {CARRIERS[id].label}
            </label>
          );
        })}
      </div>
      <button
        type="button"
        title="Coming soon"
        className="mt-auto px-3 h-8 rounded-lg text-[12px] font-semibold bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] opacity-70 cursor-default"
      >
        Manage carriers
      </button>
    </div>
  );
}
