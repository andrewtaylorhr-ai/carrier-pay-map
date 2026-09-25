"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  parseHirePerformanceWorkbook,
  recruiterHireRanked,
  type HirePerformanceRecord,
  type RecruiterHireRow,
} from "@/lib/activity/hirePerformance";
import { useHirePerformance } from "@/lib/hooks/useHirePerformance";

const SINCE_MONTHS = 6;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

interface ImportSummary {
  total: number;
  recruiters: number;
  confirmed: number;
  pending: number;
  reversed: number;
  unclear: number;
}

function UploadHireReportPanel({ onImport }: { onImport: (records: HirePerformanceRecord[], sourceFile: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleFile = async (file: File) => {
    setError("");
    setSummary(null);
    try {
      const buffer = await file.arrayBuffer();
      const records = parseHirePerformanceWorkbook(buffer, file.name);
      if (records.length === 0) {
        setError(`No hire rows found in "${file.name}" — expected a driver name in column B and a recruiter name in column C on every row.`);
        return;
      }
      onImport(records, file.name);
      setSummary({
        total: records.length,
        recruiters: new Set(records.map((r) => r.recruiter)).size,
        confirmed: records.filter((r) => r.outcome === "confirmed").length,
        pending: records.filter((r) => r.outcome === "pending").length,
        reversed: records.filter((r) => r.outcome === "reversed").length,
        unclear: records.filter((r) => r.outcome === "unclear").length,
      });
    } catch {
      setError(`Couldn't parse "${file.name}" — make sure it's a valid .xlsx export.`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex flex-col gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          Import hire performance report
        </div>
        <div className="text-[12px] text-[var(--cpm-text-dim)] mt-0.5">
          Upload the recruiter &ldquo;Performance&rdquo; workbook (.xlsx) — one row per Hired driver with a follow-up
          note. Whether a hire actually stuck is read from that note (mentions of &ldquo;invoice&rdquo; or
          &ldquo;dispatched&rdquo; = confirmed, &ldquo;no dispatch yet&rdquo; = still pending, &ldquo;not hired&rdquo;
          = reversed). Re-uploading replaces the whole dataset with the latest export.
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="text-[12.5px] text-[var(--cpm-text-dim)]"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        }}
      />
      {error && <div className="text-[12px] text-[var(--cpm-red)]">{error}</div>}
      {summary && (
        <div className="text-[12px] text-[var(--cpm-green)]">
          Imported {summary.total} hires across {summary.recruiters} recruiters — {summary.confirmed} confirmed,{" "}
          {summary.pending} still pending dispatch, {summary.reversed} reversed, {summary.unclear} with no
          follow-up signal in the note.
        </div>
      )}
    </div>
  );
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

function OutcomeBadge({ outcome }: { outcome: "pending" | "reversed" }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
        outcome === "reversed"
          ? "bg-[var(--cpm-red-soft)] text-[#ff9a9d] border border-[var(--cpm-red)]/40"
          : "bg-[color-mix(in_srgb,var(--cpm-accent)_16%,transparent)] text-[var(--cpm-accent)] border border-[var(--cpm-accent)]/40"
      }`}
    >
      {outcome}
    </span>
  );
}

function RecruiterRow({ row }: { row: RecruiterHireRow }) {
  const [expanded, setExpanded] = useState(false);
  const clean = row.reversed === 0 && row.pending === 0;

  return (
    <div className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-3">
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-[13.5px] text-[var(--cpm-text)]">{row.recruiter}</span>
          {clean && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cpm-green)]">clean</span>
          )}
        </span>
        <div className="flex items-center gap-3 text-[12px] text-[var(--cpm-text-dim)] shrink-0">
          <span>{row.total} hires</span>
          <span className="text-[var(--cpm-green)] font-semibold">
            {row.confirmed} confirmed · {pct(row.confirmed, row.total)}
          </span>
          {row.pending > 0 && <span className="text-[var(--cpm-accent)] font-semibold">{row.pending} pending</span>}
          {row.reversed > 0 && <span className="text-[var(--cpm-red)] font-semibold">{row.reversed} reversed</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {row.carriers.map((c) => (
          <span
            key={c}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[var(--cpm-panel)] text-[var(--cpm-text-faint)] border border-[var(--cpm-border)] whitespace-nowrap"
          >
            {c}
          </span>
        ))}
      </div>
      {row.issues.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-[11.5px] font-semibold text-[var(--cpm-accent)] hover:underline"
          >
            {expanded ? "Hide" : "Show"} {row.issues.length} driver{row.issues.length === 1 ? "" : "s"} needing follow-up
          </button>
          {expanded && (
            <div className="flex flex-col gap-1.5 mt-2">
              {row.issues.map((issue, i) => (
                <div
                  key={`${issue.name}-${i}`}
                  className="rounded-md border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-2 text-[12px]"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--cpm-text)]">{issue.name}</span>
                    <span className="text-[var(--cpm-text-faint)]">{issue.carrier}</span>
                    <OutcomeBadge outcome={issue.outcome} />
                  </div>
                  <div className="text-[var(--cpm-text-dim)] mt-0.5">{issue.note || "No note."}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RecruiterReviewApp() {
  const [records, setRecords] = useHirePerformance();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleImport = (imported: HirePerformanceRecord[], sourceFile: string) => {
    setRecords(imported.map((r) => ({ ...r, sourceFile })));
  };

  const rows = useMemo(() => recruiterHireRanked(records, SINCE_MONTHS), [records]);

  const dateBounds = useMemo(() => {
    const dates = records
      .map((r) => r.hiredDate ?? r.submittedDate)
      .filter((d): d is string => !!d)
      .sort();
    return dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null;
  }, [records]);

  if (!mounted) return null;

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total;
      acc.confirmed += r.confirmed;
      acc.pending += r.pending;
      acc.reversed += r.reversed;
      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, reversed: 0 }
  );

  return (
    <div className="flex flex-col gap-4">
      <UploadHireReportPanel onImport={handleImport} />

      {records.length === 0 ? (
        <div className="text-[13px] text-[var(--cpm-text-dim)] py-8 text-center">
          No hire performance data imported yet. Upload the Performance workbook above to get started.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
                  Trailing {SINCE_MONTHS}-month window
                </div>
                <div className="text-[11.5px] text-[var(--cpm-text-faint)] mt-0.5">
                  {dateBounds ? `Full import covers ${formatDate(dateBounds.from)} – ${formatDate(dateBounds.to)}. Window is anchored to the most recent record, not today's date.` : "No dated records."}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[12.5px] text-[var(--cpm-text-dim)]">
                <span>{totals.total} hires</span>
                <span className="text-[var(--cpm-green)] font-semibold">{totals.confirmed} confirmed</span>
                <span className="text-[var(--cpm-accent)] font-semibold">{totals.pending} pending</span>
                <span className="text-[var(--cpm-red)] font-semibold">{totals.reversed} reversed</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
              Recruiter hire retention
            </div>
            <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
              Ranked worst-first — reversed and still-pending hires surface at the top so a problem is easy to spot,
              then check whether it shows up for other recruiters too. Outcome is read from each hire&apos;s
              follow-up note, not a status field the source file doesn&apos;t have — some hires have no
              dispatch-tracking language at all and land in neither bucket.
            </div>
            {rows.length === 0 ? (
              <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">
                No recruiter-attributed hires in the last {SINCE_MONTHS} months.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {rows.map((row) => (
                  <RecruiterRow key={row.recruiter} row={row} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
