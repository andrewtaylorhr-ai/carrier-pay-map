"use client";

import { useCarrierMap } from "@/lib/carrier-map-context";

export function ColorModeBar() {
  const { strategyMode, colorMode, setColorMode } = useCarrierMap();
  if (!strategyMode) return null;

  return (
    <div className="toolbar-group">
      <div className="toolbar-label">Color map by</div>
      <div id="colorModeBar">
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
      <button type="button" className={colorMode === "hires" ? "active" : undefined} onClick={() => setColorMode("hires")}>
        Hires
      </button>
      </div>
    </div>
  );
}
