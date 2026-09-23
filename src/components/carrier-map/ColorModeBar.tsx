"use client";

import { useCarrierMap } from "@/lib/carrier-map-context";

export function ColorModeBar() {
  const { strategyMode, colorMode, setColorMode } = useCarrierMap();
  if (!strategyMode) return null;

  return (
    <div id="colorModeBar">
      <span>Color map by:</span>
      <button type="button" className={colorMode === "carrier" ? "active" : undefined} onClick={() => setColorMode("carrier")}>
        Carrier
      </button>
      <button
        type="button"
        className={colorMode === "recruiter" ? "active" : undefined}
        onClick={() => setColorMode("recruiter")}
      >
        Recruiter
      </button>
    </div>
  );
}
