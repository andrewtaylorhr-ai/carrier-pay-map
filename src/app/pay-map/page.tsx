import { CatNote } from "@/components/carrier-map/CatNote";
import { ChoroplethMap } from "@/components/carrier-map/ChoroplethMap";
import { DetailCard } from "@/components/carrier-map/DetailCard";
import { Legend } from "@/components/carrier-map/Legend";
import { Toolbar } from "@/components/carrier-map/Toolbar";
import { ViewMode } from "@/components/shared/ViewMode";

// Read-only pay explorer: pick a carrier + category, see pay by state, click
// a state for its accounts. Assigning happens in the Strategy Builder.
export default function PayMapPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
      <ViewMode strategy={false} />
      <h1 className="text-[22px] font-bold text-[var(--cpm-text)]">Pay Map</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5 mb-4">
        Pick a carrier and a category to see pay by state. Click a state to see every open account there.
      </p>
      <Toolbar showViewToggle={false} />
      <div className="wizCard mt-2">
        <ChoroplethMap />
        <Legend />
        <CatNote />
      </div>
      <div className="mt-4">
        <DetailCard />
      </div>
    </div>
  );
}
