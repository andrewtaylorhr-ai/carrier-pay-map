import { PayMapViews } from "@/components/carrier-map/PayMapViews";
import { ViewMode } from "@/components/shared/ViewMode";

// Read-only pay explorer. Assigning happens in the Strategy Builder.
export default function PayMapPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
      <ViewMode strategy={false} />
      <h1 className="text-[22px] font-bold text-[var(--cpm-text)]">Pay Map</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5 mb-4">
        See every carrier&apos;s pay by state, or pick one carrier and category for its accounts.
      </p>
      <PayMapViews />
    </div>
  );
}
