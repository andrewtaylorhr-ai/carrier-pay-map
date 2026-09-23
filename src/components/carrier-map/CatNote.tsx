"use client";

import { getCatNote } from "@/lib/carriers/catNote";
import { useCarrierMap } from "@/lib/carrier-map-context";

export function CatNote() {
  const { currentCarrier, currentCat, strategyMode } = useCarrierMap();
  if (strategyMode) return null;
  const note = getCatNote(currentCarrier, currentCat);
  if (!note) return null;
  return <div id="catNote" dangerouslySetInnerHTML={{ __html: note }} />;
}
