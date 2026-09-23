"use client";

import { useMapStyle } from "@/lib/hooks/useMapStyle";

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", marginRight: 4 }}
    />
  );
}

// Data-driven legend: one component reading a LegendSpec union, instead of
// mode-specific JSX scattered across the app (see useMapStyle()).
export function Legend() {
  const { legend } = useMapStyle();

  if (legend.kind === "empty") return <div id="legend" />;

  if (legend.kind === "recruiter-filtered") {
    return (
      <div id="legend">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Dot color={legend.color} />
          {legend.name}
        </span>
        <span style={{ marginLeft: 10 }}>dimmed = other recruiters / unassigned · thick border = shared with another recruiter</span>
      </div>
    );
  }

  if (legend.kind === "recruiter-all") {
    return (
      <div id="legend">
        {legend.items.map((r) => (
          <span key={r.name} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Dot color={r.color} />
            {r.name}
          </span>
        ))}
        <span style={{ marginLeft: 10 }}>gray = unassigned · split color + thick border = shared between recruiters</span>
      </div>
    );
  }

  if (legend.kind === "carrier-assign") {
    return (
      <div id="legend">
        {legend.items.map((c) => (
          <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Dot color={c.color} />
            {c.label}
          </span>
        ))}
        <span style={{ marginLeft: 10 }}>gray = unassigned</span>
      </div>
    );
  }

  if (legend.kind === "binary") {
    return (
      <div id="legend">
        <span>
          <Dot color={legend.carrierColor} />
          hires here
        </span>
        <span style={{ marginLeft: 12 }}>
          <Dot color="#f4c7c3" />
          does not hire
        </span>
        <span style={{ marginLeft: 12 }}>gray = no data</span>
      </div>
    );
  }

  // gradient
  return (
    <div id="legend">
      <span>{legend.minLabel}</span>
      <div
        style={{
          width: 140,
          height: 10,
          borderRadius: 4,
          background: `linear-gradient(to right, ${legend.minColor}, ${legend.maxColor})`,
        }}
      />
      <span>{legend.maxLabel}</span>
      <span style={{ marginLeft: 16 }}>gray = no data for this category</span>
      <span style={{ marginLeft: 16 }}>darker = higher pay · click a state for details</span>
    </div>
  );
}
