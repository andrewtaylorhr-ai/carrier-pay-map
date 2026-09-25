"use client";

import { useMemo } from "react";
import { Award, Calendar, Percent, Sparkles, Users } from "lucide-react";
import { dateRange } from "@/lib/activity/analyze";
import {
  buildKeyInsights,
  carrierVolumeRanked,
  groupedForChart,
  overallTotals,
  recruiterPerformance,
} from "@/lib/activity/dashboardStats";
import type { CarrierActivityData } from "@/lib/activity/types";
import { StatCard } from "./StatCard";
import { SubmissionsChart } from "./SubmissionsChart";
import { CarrierDonut } from "./CarrierDonut";
import { RecruiterPerformanceTable } from "./RecruiterPerformanceTable";
import { TopCarriersTable } from "./TopCarriersTable";
import { KeyInsights } from "./KeyInsights";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function InsightsDashboard({
  data,
  onSelectCarrier,
}: {
  data: CarrierActivityData;
  onSelectCarrier: (carrier: string) => void;
}) {
  const totals = useMemo(() => overallTotals(data), [data]);
  const carrierRows = useMemo(() => carrierVolumeRanked(data), [data]);
  const chartSlices = useMemo(() => groupedForChart(carrierRows), [carrierRows]);
  const recruiterRows = useMemo(() => recruiterPerformance(data), [data]);
  const insights = useMemo(() => buildKeyInsights(data, carrierRows, recruiterRows), [data, carrierRows, recruiterRows]);
  const carriers = useMemo(() => Object.keys(data).sort(), [data]);
  const range = useMemo(() => dateRange(Object.values(data).flatMap((e) => e.records)), [data]);

  return (
    <div className="flex flex-col gap-4 pb-5 mb-1 border-b border-[var(--cpm-border)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-[var(--cpm-text)]">Recruiter Strategy &amp; Carrier Insights</h2>
          <div className="text-[12px] text-[var(--cpm-text-faint)] mt-0.5">
            Computed live from {carriers.length} imported carrier{carriers.length === 1 ? "" : "s"}.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12px] text-[var(--cpm-text-dim)]">
            <Calendar size={13} />
            {range ? `${formatDate(range.from)} – ${formatDate(range.to)}` : "No dated records"}
          </div>
          <button
            type="button"
            title="Coming soon"
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-[var(--cpm-accent)] text-[#241800] opacity-70 cursor-default"
          >
            Create Strategy Plan
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard icon={Users} label="Total submissions" value={String(totals.totalSubmissions)} sub={`${totals.carrierCount} carriers`} />
        <StatCard icon={Award} label="Total hires" value={String(totals.totalHires)} sub={`${totals.totalActive} still active`} />
        <StatCard icon={Percent} label="Hire rate" value={totals.hireRate != null ? `${Math.round(totals.hireRate * 100)}%` : "—"} sub={`${totals.totalDq} DQ'd`} />
        <StatCard icon={Sparkles} label="Recruiters detected" value={String(totals.recruiterCount)} sub="best-effort, parsed from notes" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <SubmissionsChart rows={carrierRows} />
        <CarrierDonut slices={chartSlices} total={totals.totalSubmissions} />
      </div>

      <RecruiterPerformanceTable rows={recruiterRows} carriers={carriers} onSelectCarrier={onSelectCarrier} />

      <div className="flex flex-col lg:flex-row gap-4">
        <TopCarriersTable rows={carrierRows} onSelectCarrier={onSelectCarrier} />
        <KeyInsights insights={insights} />
      </div>
    </div>
  );
}
