"use client";

import { useState } from "react";
import { Layers, Truck } from "lucide-react";
import { AllCarriersPay } from "./AllCarriersPay";
import { CatNote } from "./CatNote";
import { ChoroplethMap } from "./ChoroplethMap";
import { DetailCard } from "./DetailCard";
import { Legend } from "./Legend";
import { Toolbar } from "./Toolbar";

// Pay Map: "All carriers" (every carrier's pay range per state) or
// "One carrier" (the original carrier + category explorer).
export function PayMapViews() {
  const [view, setView] = useState<"all" | "one">("all");
  return (
    <>
      <div className="segTabs mb-4">
        <button type="button" className={view === "all" ? "active" : undefined} onClick={() => setView("all")}>
          <Layers size={14} /> All carriers
        </button>
        <button type="button" className={view === "one" ? "active" : undefined} onClick={() => setView("one")}>
          <Truck size={14} /> One carrier
        </button>
      </div>
      {view === "all" ? (
        <AllCarriersPay />
      ) : (
        <>
          <Toolbar showViewToggle={false} />
          <div className="wizCard mt-2">
            <ChoroplethMap />
            <Legend />
            <CatNote />
          </div>
          <div className="mt-4">
            <DetailCard />
          </div>
        </>
      )}
    </>
  );
}
