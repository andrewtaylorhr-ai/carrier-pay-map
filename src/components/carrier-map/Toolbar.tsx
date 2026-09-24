"use client";

import { CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";

export function Toolbar() {
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
                style={{
                  borderColor: c.color,
                  background: active ? `${c.color}22` : "var(--cpm-panel-alt)",
                  boxShadow: active ? `0 3px 10px ${c.color}55` : undefined,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt={c.label} className="carrierLogo" />
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

      <div className="toolbar-group">
        <div className="toolbar-label">View</div>
        <div id="modeBar">
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
        </div>
      </div>
    </div>
  );
}
