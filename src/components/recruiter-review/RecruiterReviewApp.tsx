"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, ChevronUp, TrendingUp, UserCheck, Users } from "lucide-react";
import {
  carrierHireRanked,
  monthlyHiresByRecruiter,
  hireTrendByMonth,
  parseHirePerformanceWorkbook,
  recruiterHireRanked,
  type CarrierHireRow,
  type HirePerformanceRecord,
  type RecruiterHireRow,
} from "@/lib/activity/hirePerformance";
import { useHirePerformance } from "@/lib/hooks/useHirePerformance";
import { CarrierDonut } from "@/components/activity/dashboard/CarrierDonut";
import { StatCard } from "@/components/activity/dashboard/StatCard";
import { CHART_OTHERS_COLOR, colorForIndex, type ChartSlice } from "@/lib/activity/dashboardStats";
import { RecruiterHireChart } from "./RecruiterHireChart";
import { HireTrendChart } from "./HireTrendChart";
import { MonthlyHiresTable } from "./MonthlyHiresTable";
import { ManagerInsights } from "./ManagerInsights";
import { RecruiterPerformanceTable } from "./RecruiterPerformanceTable";
import { ActionCenter } from "./ActionCenter";

const SINCE_MONTHS = 6;
const DONUT_TOP_N = 6;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

// Groups the tail of a carrier-volume ranking into a single gray "Others"
// slice, same top-N pattern as dashboardStats.groupedForChart — but that
// helper is coupled to CarrierVolumeRow's shape (r.counts.total, r.color),
// not the simpler CarrierHireRow this page works with, so it's reimplemented
// inline here.
function carrierSlicesFor(rows: CarrierHireRow[], topN = DONUT_TOP_N): ChartSlice[] {
  const head = rows.slice(0, topN).map((r, i) => ({ name: r.carrier, value: r.total, color: colorForIndex(i) }));
  const tail = rows.slice(topN);
  if (tail.length === 0) return head;
  const othersTotal = tail.reduce((sum, r) => sum + r.total, 0);
  return [...head, { name: "Others", value: othersTotal, color: CHART_OTHERS_COLOR }];
}

interface ImportSummary {
  total: number;
  recruiters: number;
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
          Upload the recruiter &ldquo;Performance&rdquo; workbook (.xlsx) — one row per Hired driver. This source only
          ever contains Hired drivers, so every row counts as a hire. Re-uploading replaces the whole dataset with the
          latest export.
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
          Imported {summary.total} hires across {summary.recruiters} recruiters.
        </div>
      )}
    </div>
  );
}

function formatHireDate(iso: string | null): string {
  if (!iso) return "No date";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

function RecruiterRow({ row, total }: { row: RecruiterHireRow; total: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between flex-wrap gap-x-4 gap-y-1.5 text-left"
      >
        <span className="flex items-center gap-1.5">
          {expanded ? (
            <ChevronUp size={14} className="text-[var(--cpm-text-faint)] shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-[var(--cpm-text-faint)] shrink-0" />
          )}
          <span className="font-bold text-[13.5px] text-[var(--cpm-text)]">{row.recruiter}</span>
        </span>
        <div className="flex items-center gap-3 text-[12px] text-[var(--cpm-text-dim)] shrink-0">
          <span>{row.total} hires</span>
          <span className="text-[var(--cpm-text-faint)]">{pct(row.total, total)} of total</span>
          <span>Top carrier: {row.topCarrier}</span>
        </div>
      </button>
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
      {expanded && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--cpm-text-faint)] border-b border-[var(--cpm-border)]">
                <th className="py-1.5 pr-2 font-semibold">Driver</th>
                <th className="py-1.5 pr-2 font-semibold">Carrier</th>
                <th className="py-1.5 pr-2 font-semibold">Account</th>
                <th className="py-1.5 pl-2 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {row.hires.map((h, i) => (
                <tr key={`${h.name}-${i}`} className="border-b border-[var(--cpm-border)] last:border-0">
                  <td className="py-1.5 pr-2 text-[var(--cpm-text)] whitespace-nowrap">{h.name}</td>
                  <td className="py-1.5 pr-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{h.carrier}</td>
                  <td className="py-1.5 pr-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{h.account || "—"}</td>
                  <td className="py-1.5 pl-2 text-[var(--cpm-text-dim)] whitespace-nowrap text-right">{formatHireDate(h.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const trendRows = useMemo(() => hireTrendByMonth(records, SINCE_MONTHS), [records]);
  const carrierRows = useMemo(() => carrierHireRanked(records, SINCE_MONTHS), [records]);
  const carrierSlices = useMemo(() => carrierSlicesFor(carrierRows), [carrierRows]);
  const monthlyMatrix = useMemo(() => monthlyHiresByRecruiter(records, SINCE_MONTHS), [records]);

  const dateBounds = useMemo(() => {
    const dates = records
      .map((r) => r.hiredDate ?? r.submittedDate)
      .filter((d): d is string => !!d)
      .sort();
    return dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null;
  }, [records]);

  if (!mounted) return null;

  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const avgPerMonth = trendRows.length > 0 ? Math.round(total / trendRows.length) : 0;

  return (
    <div className="flex flex-col gap-4">
      <UploadHireReportPanel onImport={handleImport} />

      {records.length === 0 ? (
        <div className="text-[13px] text-[var(--cpm-text-dim)] py-8 text-center">
          No hire performance data imported yet. Upload the Performance workbook above to get started.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-[11.5px] text-[var(--cpm-text-faint)]">
              Trailing {SINCE_MONTHS}-month window — window is anchored to the most recent record, not today&apos;s
              date.
            </div>
            {dateBounds && (
              <div className="text-[11.5px] font-semibold text-[var(--cpm-text-dim)] bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] rounded-full px-3 py-1 shrink-0">
                {formatDate(dateBounds.from)} – {formatDate(dateBounds.to)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total hires" value={String(total)} sub={`${rows.length} recruiters`} />
            <StatCard icon={UserCheck} label="Active recruiters" value={String(rows.length)} sub="in this window" />
            <StatCard icon={Building2} label="Carriers used" value={String(carrierRows.length)} sub="in this window" />
            <StatCard icon={TrendingUp} label="Avg / month" value={String(avgPerMonth)} sub={`over ${trendRows.length} month${trendRows.length === 1 ? "" : "s"}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div id="hires-trend" className="lg:col-span-8 flex">
              <HireTrendChart rows={trendRows} />
            </div>
            <div className="lg:col-span-4 flex">
              <ManagerInsights rows={rows} carrierRows={carrierRows} trendRows={trendRows} total={total} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-8 flex">
              <RecruiterPerformanceTable rows={rows} total={total} />
            </div>
            <div className="lg:col-span-4 flex">
              <ActionCenter />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-2 flex">
              <RecruiterHireChart rows={rows} />
            </div>
            <div id="carrier-breakdown" className="flex">
              <CarrierDonut slices={carrierSlices} total={total} title="Hires by carrier" />
            </div>
          </div>

          <div className="flex">
            <MonthlyHiresTable matrix={monthlyMatrix} />
          </div>

          <div id="recruiter-detail" className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
              Recruiter detail
            </div>
            <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
              Ranked by volume, highest producer first. Click a recruiter to see every individual hire — driver,
              carrier, account, and date.
            </div>
            {rows.length === 0 ? (
              <div className="text-[12px] text-[var(--cpm-text-faint)] py-4 text-center">
                No recruiter-attributed hires in the last {SINCE_MONTHS} months.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {rows.map((row) => (
                  <RecruiterRow key={row.recruiter} row={row} total={total} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
