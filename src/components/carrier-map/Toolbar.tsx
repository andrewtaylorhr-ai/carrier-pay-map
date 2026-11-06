"use client";

import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { BASE_PATH } from "@/lib/basePath";
import type { ReactNode } from "react";

// One controls card: carrier logos (on light tiles so every logo reads the
// same), then category / view / any extra groups (e.g. ColorModeBar) in a row.
export function Toolbar({ showViewToggle = true, children }: { showViewToggle?: boolean; children?: ReactNode } = {}) {
  const { currentCarrier, setCarrier, currentCat, setCat, strategyMode, setStrategyMode, setSelectedState } = useCarrierMap();

  return (
    <div id="toolbar">
      <div className="toolbar-group">
        <div className="toolbar-label">Carrier</div>
        <div id="carrierTabs">
          {CARRIER_ORDER.map((id) => {
            const c = CARRIERS[id];
            const active = id === currentCarrier;
            return (
              <button
                key={id}
                type="button"
                title={c.label}
                aria-label={c.label}
                onClick={() => setCarrier(id)}
                className={active ? "active" : undefined}
                style={active ? { borderColor: c.color, boxShadow: `0 0 0 3px ${c.color}55` } : undefined}
              >
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${BASE_PATH}${c.logo}`} alt={c.label} className="carrierLogo" />
                ) : (
                  <span className="carrierLabel">
                    <i style={{ background: c.color }} />
                    {c.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="toolbar-group">
        <div className="toolbar-label">Category</div>
        <div id="catTabs">
          {CARRIERS[currentCarrier].cats.map((cat) => (
            <button
              key={cat}
              type="button"
              className={cat === currentCat ? "active" : undefined}
              onClick={() => setCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {showViewToggle && (
        <div className="toolbar-group">
          <div className="toolbar-label">View</div>
          <div id="modeBar">
            <button
              type="button"
              className={strategyMode ? "active" : undefined}
              onClick={() => {
                setStrategyMode(true);
                setSelectedState(null);
              }}
            >
              Strategy assignment view
            </button>
            <button
              type="button"
              className={!strategyMode ? "active" : undefined}
              onClick={() => {
                setStrategyMode(false);
                setSelectedState(null);
              }}
            >
              Pay / coverage view
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
