import { CatNote } from "./CatNote";
import { ChoroplethMap } from "./ChoroplethMap";
import { Legend } from "./Legend";
import { StateSelectList } from "./StateSelectList";

// Card wrapper around the existing (unchanged) D3 choropleth + legend, plus
// the new state list alongside it. Purely a container/layout restyle — the
// map's imperative D3 mount/restyle logic in ChoroplethMap.tsx is untouched.
export function StatePerformancePanel() {
  return (
    <div className="px-6 pt-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2">
            State performance
          </div>
          <ChoroplethMap />
          <Legend />
          <CatNote />
        </div>
        <StateSelectList />
      </div>
    </div>
  );
}
