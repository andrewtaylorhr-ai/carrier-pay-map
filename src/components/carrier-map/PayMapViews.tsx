"use client";

import { useState } from "react";
import { Briefcase, Layers, Truck } from "lucide-react";
import { AllCarriersPay } from "./AllCarriersPay";
import { IndeedPay } from "./IndeedPay";
import { OneCarrierPay } from "./OneCarrierPay";

// Pay Map: "All carriers" (every carrier's pay range per state) or
// "One carrier" (one carrier + category, top pay per state) or
// "Indeed pay" (Indeed's average truck driver pay per state).
export function PayMapViews() {
  const [view, setView] = useState<"all" | "one" | "indeed">("all");
  return (
    <>
      <div className="segTabs mb-4">
        <button type="button" className={view === "all" ? "active" : undefined} onClick={() => setView("all")}>
          <Layers size={14} /> All carriers
        </button>
        <button type="button" className={view === "one" ? "active" : undefined} onClick={() => setView("one")}>
          <Truck size={14} /> One carrier
        </button>
        <button type="button" className={view === "indeed" ? "active" : undefined} onClick={() => setView("indeed")}>
          <Briefcase size={14} /> Indeed pay
        </button>
      </div>
      {view === "all" ? (
        <AllCarriersPay />
      ) : view === "indeed" ? (
        <IndeedPay />
      ) : (
        <OneCarrierPay />
      )}
    </>
  );
}
