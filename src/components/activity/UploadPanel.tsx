"use client";

import { useRef, useState } from "react";
import { parseDriverUpdatesWorkbook } from "@/lib/activity/parseWorkbook";
import type { DriverRecord } from "@/lib/activity/types";

function suggestCarrierName(filename: string): string {
  return filename
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[_-]?driver[_-]?updates?/gi, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

interface PendingFile {
  key: string;
  file: File;
  buffer: ArrayBuffer;
  carrierName: string;
}

interface ImportSummary {
  carrier: string;
  total: number;
  active: number;
  dq: number;
  hired: number;
  recruitersFound: number;
}

export function UploadPanel({
  onImport,
}: {
  onImport: (carrier: string, records: DriverRecord[], sourceFile: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ImportSummary[] | null>(null);

  const handleFiles = async (files: FileList) => {
    setError("");
    setResults(null);
    const next: PendingFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const buffer = await file.arrayBuffer();
        next.push({
          key: `${file.name}__${file.size}__${file.lastModified}`,
          file,
          buffer,
          carrierName: suggestCarrierName(file.name),
        });
      } catch {
        setError((prev) => (prev ? `${prev} Also couldn't read "${file.name}".` : `Couldn't read "${file.name}".`));
      }
    }
    setPending((prev) => [...prev, ...next]);
  };

  const updateCarrierName = (key: string, name: string) => {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, carrierName: name } : p)));
  };

  const removePending = (key: string) => {
    setPending((prev) => prev.filter((p) => p.key !== key));
  };

  const cancel = () => {
    setPending([]);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const doImportAll = () => {
    const blanks = pending.filter((p) => !p.carrierName.trim());
    if (blanks.length > 0) {
      setError(`Give every file a carrier name before importing (missing: ${blanks.map((b) => b.file.name).join(", ")}).`);
      return;
    }

    const summaries: ImportSummary[] = [];
    const failures: string[] = [];

    for (const p of pending) {
      try {
        const carrier = p.carrierName.trim();
        const records = parseDriverUpdatesWorkbook(p.buffer, carrier, p.file.name);
        if (records.length === 0) {
          failures.push(`${p.file.name}: no driver rows found — couldn't detect a name column on any sheet.`);
          continue;
        }
        const active = records.filter((r) => r.status === "Active").length;
        const dq = records.filter((r) => r.status === "DQ").length;
        const hired = records.filter((r) => r.status === "Hired").length;
        const recruitersFound = records.filter((r) => r.recruiter).length;
        onImport(carrier, records, p.file.name);
        summaries.push({ carrier, total: records.length, active, dq, hired, recruitersFound });
      } catch {
        failures.push(`${p.file.name}: couldn't parse — make sure it's a valid .xlsx, .xls, or .csv export.`);
      }
    }

    setResults(summaries.length > 0 ? summaries : null);
    setError(failures.join(" "));
    setPending([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex flex-col gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Import driver updates
        </div>
        <div className="text-[12px] text-[var(--cpm-text-dim)] mt-0.5">
          Upload one or more carriers&apos; driver-updates exports at once (.xlsx or .csv) — Active/DQ/Hired tabs, one
          flat sheet with a Status column, whatever that carrier sends. Select multiple files in the picker
          (ctrl/shift-click), confirm each carrier name below, then import them all together. Re-uploading the same
          carrier name replaces its data with the latest snapshot.
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="text-[12.5px] text-[var(--cpm-text-dim)]"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          }}
        />
      </div>
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            {pending.map((p) => (
              <div key={p.key} className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-[var(--cpm-text-dim)] w-[220px] truncate" title={p.file.name}>
                  {p.file.name}
                </span>
                <input
                  type="text"
                  value={p.carrierName}
                  onChange={(e) => updateCarrierName(p.key, e.target.value)}
                  placeholder="Carrier name"
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)] text-[12.5px] w-[220px]"
                />
                <button
                  type="button"
                  onClick={() => removePending(p.key)}
                  className="text-[var(--cpm-text-faint)] hover:text-[var(--cpm-red)] text-[11px] leading-none px-1"
                  title="Remove from import"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={doImportAll}
              className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold border border-[var(--cpm-accent)] bg-[var(--cpm-accent)] text-[#241800]"
            >
              Import all ({pending.length})
            </button>
            <button
              type="button"
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div className="text-[12px] text-[var(--cpm-red)]">{error}</div>}
      {results && (
        <div className="text-[12px] text-[var(--cpm-green)] flex flex-col gap-0.5">
          {results.map((r) => (
            <div key={r.carrier}>
              {r.carrier}: imported {r.total} drivers ({r.active} active, {r.dq} DQ, {r.hired} hired) — recruiter
              detected on {r.recruitersFound} of {r.total}.
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
