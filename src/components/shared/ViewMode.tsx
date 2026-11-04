"use client";

import { useEffect } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";

// Pages share one carrier-map context (it lives in the root layout), so each
// page sets the view mode it needs when it opens.
export function ViewMode({ strategy }: { strategy: boolean }) {
  const { setStrategyMode, setSelectedState, setAssignModeRecruiter } = useCarrierMap();
  useEffect(() => {
    setStrategyMode(strategy);
    setSelectedState(null);
    setAssignModeRecruiter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy]);
  return null;
}
