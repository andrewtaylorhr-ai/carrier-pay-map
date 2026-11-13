"use client";

import { useMemo } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { EMPTY_INBOX, EMPTY_PIPELINE, PIPELINE_INBOX_KEY, PIPELINE_KEY, buildPipeline, type PipelineInbox, type PipelineSettings } from "@/lib/pipeline";
import { useLocalStorageState } from "./useLocalStorage";

// The emails the Gmail script saved (read only) and the team's own settings.
export function usePipeline() {
  const { recruiters } = useCarrierMap();
  const [inbox] = useLocalStorageState<PipelineInbox>(PIPELINE_INBOX_KEY, EMPTY_INBOX);
  const [settings, setSettings] = useLocalStorageState<PipelineSettings>(PIPELINE_KEY, EMPTY_PIPELINE);
  const pipeline = useMemo(() => buildPipeline(inbox, settings, recruiters), [inbox, settings, recruiters]);
  return { inbox, settings, setSettings, pipeline };
}
