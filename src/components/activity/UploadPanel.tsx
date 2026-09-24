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

export function UploadPanel({
  onImport,
}: {
  onImport: (carrier: string, records: DriverRecord[], sourceFile: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingBuffer, setPendingBuffer] = useState<ArrayBuffer | null>(null);
  const [carrierName, setCarrierName] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    total: number;
    active: number;
    dq: number;
    hired: number;
    recruitersFound: number;
  } | null>(null);

  const handleFile = async (file: File) => {
    setError("");
    setPreview(null);
    try {
      const buffer = await file.arrayBuffer();
      setPendingFile(file);
      setPendingBuffer(buffer);
      setCarrierName(suggestCarrierName(file.name));
    } catch {
      setError("Couldn't read that file — make sure it's a .xlsx, .xls, or .csv export.");
    }
  };

  const cancel = () => {
    setPendingFile(null);
    setPendingBuffer(null);
    setCarrierName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const doImport = () => {
    if (!pendingBuffer || !pendingFile || !carrierName.trim()) return;
    try {
      const records = parseDriverUpdatesWorkbook(pendingBuffer, carrierName.trim(), pendingFile.name);
      if (records.length === 0) {
        setError("No driver rows found in that file — couldn't detect a name column on any sheet.");
        return;
      }
      const active = records.filter((r) => r.status === "Active").length;
      const dq = records.filter((r) => r.status === "DQ").length;
      const hired = records.filter((r) => r.status === "Hired").length;
      const recruitersFound = records.filter((r) => r.recruiter).length;
      onImport(carrierName.trim(), records, pendingFile.name);
      setPreview({ total: records.length, active, dq, hired, recruitersFound });
      setPendingFile(null);
      setPendingBuffer(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Couldn't parse that file — make sure it's a valid .xlsx, .xls, or .csv export.");
    }
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex flex-col gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Import driver updates
        </div>
        <div className="text-[12px] text-[var(--cpm-text-dim)] mt-0.5">
          Upload a carrier&apos;s driver-updates export (.xlsx or .csv) — Active/DQ/Hired tabs, one flat sheet with a
          Status column, whatever that carrier sends. Re-uploading the same carrier name replaces its data with the
          latest snapshot.
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="text-[12.5px] text-[var(--cpm-text-dim)]"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {pendingFile && (
          <>
            <input
              type="text"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              placeholder="Carrier name"
              className="px-2.5 py-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)] text-[12.5px] w-[180px]"
            />
            <button
              type="button"
              onClick={doImport}
              disabled={!carrierName.trim()}
              className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold border border-[var(--cpm-accent)] bg-[var(--cpm-accent)] text-[#241800] disabled:opacity-50"
            >
              Import
            </button>
            <button
              type="button"
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
            >
              Cancel
            </button>
          </>
        )}
      </div>
      {error && <div className="text-[12px] text-[var(--cpm-red)]">{error}</div>}
      {preview && (
        <div className="text-[12px] text-[var(--cpm-green)]">
          Imported {preview.total} drivers ({preview.active} active, {preview.dq} DQ, {preview.hired} hired) —
          recruiter name detected on {preview.recruitersFound} of {preview.total} rows (best-effort; most notes
          won&apos;t have one).
        </div>
      )}
    </div>
  );
}
