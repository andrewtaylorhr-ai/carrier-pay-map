"use client";

import { CARRIERS } from "@/lib/carriers/data";
import type { CarrierId } from "@/lib/carriers/types";

export function AssignedBadge({ carrierIds }: { carrierIds: CarrierId[] | undefined }) {
  if (!carrierIds || !carrierIds.length)
    return <span className="assignBadge" style={{ background: "#5b6270" }}>unassigned</span>;
  return (
    <>
      {carrierIds.map((id) => (
        <span key={id} className="assignBadge" style={{ background: CARRIERS[id].color }}>
          {CARRIERS[id].label}
        </span>
      ))}
    </>
  );
}

export function RecruiterBadge({ names, recruiterColor }: { names: string[]; recruiterColor: (name: string) => string }) {
  if (!names.length) return <span className="assignBadge" style={{ background: "#5b6270" }}>no recruiter</span>;
  return (
    <>
      {names.map((r) => (
        <span key={r} className="assignBadge" style={{ background: recruiterColor(r) }}>
          {r}
        </span>
      ))}
    </>
  );
}
