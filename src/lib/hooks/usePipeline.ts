"use client";

import { useMemo } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { EMPTY_INBOX, EMPTY_PIPELINE, PIPELINE_INBOX_KEY, PIPELINE_KEY, buildPipeline, type PipelineInbox, type PipelineSettings } from "@/lib/pipeline";
import { usePipelineRows } from "@/lib/pipeline-events";
import { useLocalStorageState } from "./useLocalStorage";

// The emails the Gmail script saved (read only) and the team's own settings.
// The emails are rows of the pipeline_events table; an older Gmail script kept
// them in the inbox record instead, so any still there are counted too.
export function usePipeline() {
  const { recruiters } = useCarrierMap();
  const [record] = useLocalStorageState<PipelineInbox>(PIPELINE_INBOX_KEY, EMPTY_INBOX);
  const rows = usePipelineRows();
  const [settings, setSettings] = useLocalStorageState<PipelineSettings>(PIPELINE_KEY, EMPTY_PIPELINE);
  const inbox = useMemo<PipelineInbox>(() => {
    const old = record.events ?? [];
    if (!old.length) return { ...record, events: rows.events };
    const byId = new Map(old.map((e) => [e.id, e]));
    rows.events.forEach((e) => byId.set(e.id, e));
    return { ...record, events: [...byId.values()] };
  }, [record, rows.events]);
  const pipeline = useMemo(() => buildPipeline(inbox, settings, recruiters), [inbox, settings, recruiters]);
  return { inbox, loadingEmails: rows.loading, settings, setSettings, pipeline };
}
