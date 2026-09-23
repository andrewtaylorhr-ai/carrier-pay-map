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
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
        color: "#0b0b0b",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
        maxWidth: 280,
        left: state.x,
        top: state.y,
      }}
      dangerouslySetInnerHTML={{ __html: state.html }}
    />
  );
}
