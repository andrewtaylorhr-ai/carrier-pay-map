"use client";

import { useMemo } from "react";
import { Award, Calendar, Percent, Users, XCircle } from "lucide-react";
import { dateRange } from "@/lib/activity/analyze";
import {
  accountDqRanked,
  accountSuccessRanked,
  buildKeyInsights,
  carrierVolumeRanked,
  groupedForChart,
  overallDqReasons,
  overallTotals,
} from "@/lib/activity/dashboardStats";
import type { CarrierActivityData } from "@/lib/activity/types";
import { StatCard } from "./StatCard";
import { SubmissionsChart } from "./SubmissionsChart";
import { CarrierDonut } from "./CarrierDonut";
import { CarrierPerformanceTable } from "./CarrierPerformanceTable";
import { AccountDqPanel } from "./AccountDqPanel";
import { AccountSuccessPanel } from "./AccountSuccessPanel";
import { DqReasonsPanel } from "./DqReasonsPanel";
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
  const dqReasons = useMemo(() => overallDqReasons(data), [data]);
  const accountDqRows = useMemo(() => accountDqRanked(data), [data]);
  const accountSuccessRows = useMemo(() => accountSuccessRanked(data), [data]);
  const insights = useMemo(() => buildKeyInsights(data, carrierRows), [data, carrierRows]);
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
        <StatCard
          icon={XCircle}
          label="Total rejections"
          value={String(totals.totalDq)}
          sub={dqReasons.length > 0 ? `top reason: ${dqReasons[0].label}` : "no DQs yet"}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <SubmissionsChart rows={carrierRows} />
        <CarrierDonut slices={chartSlices} total={totals.totalSubmissions} />
      </div>

      <CarrierPerformanceTable rows={carrierRows} onSelectCarrier={onSelectCarrier} />

      <div className="flex flex-col lg:flex-row gap-4">
        <AccountSuccessPanel rows={accountSuccessRows} />
        <AccountDqPanel rows={accountDqRows} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <DqReasonsPanel reasons={dqReasons} totalDq={totals.totalDq} />
        <KeyInsights insights={insights} />
      </div>
    </div>
  );
}
