"use client";

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  html: string;
}

// Mirrors #tip from the original HTML: a fixed, pointer-events:none box that
// follows the cursor. `html` is author-controlled content built from our own
// data (see Phase 6 decision in the project plan) — safe to inject directly.
export function Tooltip({ state }: { state: TooltipState }) {
  if (!state.visible) return null;
  return (
    <div
      style={{
        display: "block",
        position: "fixed",
        pointerEvents: "none",
        background: "#262b36",
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
        color: "#e8e9ee",
        zIndex: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,.5)",
        maxWidth: 280,
        left: state.x,
        top: state.y,
      }}
      dangerouslySetInnerHTML={{ __html: state.html }}
    />
  );
}
