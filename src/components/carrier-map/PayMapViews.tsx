"use client";

import { useState } from "react";
import { Layers, Truck } from "lucide-react";
import { AllCarriersPay } from "./AllCarriersPay";
import { OneCarrierPay } from "./OneCarrierPay";

// Pay Map: "All carriers" (every carrier's pay range per state) or
// "By position" (carriers + Local/Regional/Dedicated/OTR, top pay per state).
export function PayMapViews() {
  const [view, setView] = useState<"all" | "one">("all");
  return (
    <>
      <div className="segTabs mb-4">
        <button type="button" className={view === "all" ? "active" : undefined} onClick={() => setView("all")}>
          <Layers size={14} /> All carriers
        </button>
        <button type="button" className={view === "one" ? "active" : undefined} onClick={() => setView("one")}>
          <Truck size={14} /> By position
        </button>
      </div>
      {view === "all" ? (
        <AllCarriersPay />
      ) : (
        <OneCarrierPay />
      )}
    </>
  );
}
