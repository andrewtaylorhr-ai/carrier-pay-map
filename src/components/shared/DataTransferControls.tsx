"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

// This app has no server and no accounts — every page's data lives only in
// the current browser's localStorage (see useLocalStorage.ts). That's fine
// for one device, but means opening the same URL on a different computer or
// browser starts from empty: there's nothing to sync from. This component is
// the manual workaround — export the current data to a .json file, carry
// that file to the other device (email, USB, cloud drive, whatever), import
// it there. No third-party service, no data leaves the two devices involved.
export function DataTransferControls<T>({
  data,
  hasData,
  onImport,
  exportFilename,
  validate,
}: {
  /** The current in-memory value (same shape as what the page's useLocalStorageState holds). */
  data: T;
  /** Whether there's anything worth exporting — disables the Export button when false. */
  hasData: boolean;
  /** Called with the parsed file contents on a successful import — pass the page's setter directly. */
  onImport: (value: T) => void;
  /** Base filename (no extension/date) for the downloaded export, e.g. "recruiter-review-hires". */
  exportFilename: string;
  /** Optional shape check so importing the wrong page's export file fails loudly instead of silently corrupting data. */
  validate?: (value: unknown) => boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (validate && !validate(parsed)) {
          setError(`"${file.name}" doesn't look like an export from this page — nothing was imported.`);
          return;
        }
        if (hasData && !confirm("This will replace the data currently loaded in this browser. Continue?")) return;
        onImport(parsed as T);
      } catch {
        setError(`Couldn't read "${file.name}" — make sure it's an unmodified .json file exported from this tool.`);
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.onerror = () => setError(`Couldn't read "${file.name}".`);
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleExport}
          disabled={!hasData}
          title={hasData ? "Download this browser's data as a file" : "No data to export yet"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--cpm-text-dim)] disabled:hover:border-[var(--cpm-border)]"
        >
          <Download size={13} /> Export data
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Load a previously-exported .json file into this browser"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold border border-[var(--cpm-border)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-border-strong)]"
        >
          <Upload size={13} /> Import data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          }}
        />
        <span className="text-[11px] text-[var(--cpm-text-faint)]">
          Move data to another browser/device: export here, then import there.
        </span>
      </div>
      {error && <div className="text-[11.5px] text-[var(--cpm-red)]">{error}</div>}
    </div>
  );
}
