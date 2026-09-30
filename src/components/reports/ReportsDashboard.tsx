"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { currentAndNextMonth } from "@/lib/recruiters";
import { exportTeamReportToExcel, type TeamReportRow } from "@/lib/exportRecruiterReport";
import type { RecruiterTeam } from "@/lib/carriers/types";
import { StatePerformancePanel } from "@/components/carrier-map/StatePerformancePanel";
import { DetailCard } from "@/components/carrier-map/DetailCard";
import { MonthlyTrendCard } from "@/components/dashboard/MonthlyTrendCard";
import { ReportsHeader } from "./ReportsHeader";
import { ReportsStats } from "./ReportsStats";
import { ManagerInsightsCard } from "./ManagerInsightsCard";
import { StateAssignmentTable } from "./StateAssignmentTable";
import { CarrierUsageTable } from "./CarrierUsageTable";
import { RecruiterPerformanceTable } from "./RecruiterPerformanceTable";
import { DataCoveragePanel } from "./DataCoveragePanel";
import { QuickActionsRow } from "./QuickActionsRow";

const TEAM_LABEL: Record<RecruiterTeam, string> = {
  uzbek: "Uzbek",
  philippines: "Philippines",
};

function hireRateOf(hires: number | null, submissions: number | null): string {
  if (!submissions || submissions <= 0 || hires == null) return "—";
  return `${Math.round((hires / submissions) * 100)}%`;
}

// Orchestrator for the redesigned /reports page: owns the month + team
// filter shared by the stat cards and the recruiter table, computes every
// real-data row/total once, and assembles the section layout matching the
// "Executive Dashboard" mockup the user shared — scoped to this page's
// content only (Sidebar is untouched), with honest empty/placeholder states
// everywhere this app has no real data source (see ManagerInsightsCard,
// MonthlyTrendCard, and the "—" columns in the two usage tables).
export function ReportsDashboard() {
  const {
    strategyMode,
    recruiters,
    recruiterColor,
    recruiterAssignments,
    teamFilter,
    setTeamFilter,
    getRecruiterTeam,
    getRecruiterPlan,
    getRecruiterActual,
  } = useCarrierMap();

  const months = currentAndNextMonth();
  const [monthIdx, setMonthIdx] = useState(0);
  const month = months[monthIdx];

  if (!strategyMode) {
    return (
      <>
        <ReportsHeader />
        <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 text-[13px] text-[var(--cpm-text-faint)]">
          Turn on Strategy mode (on the Dashboard) to see recruiter reports.
        </div>
      </>
    );
  }

  const visible = recruiters.filter((r) => teamFilter === "all" || getRecruiterTeam(r) === teamFilter);

  const rows = visible.map((r) => {
    const plan = getRecruiterPlan(r);
    const actual = getRecruiterActual(r, month.key);
    const statesCount = Object.keys(recruiterAssignments).filter((s) =>
      (recruiterAssignments[s] || []).includes(r)
    ).length;
    return { name: r, team: getRecruiterTeam(r), plan, actual, statesCount };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      targetSub: acc.targetSub + (row.plan.targetSubmissions ?? 0),
      actualSub: acc.actualSub + (row.actual.submissions ?? 0),
      targetHires: acc.targetHires + (row.plan.targetHires ?? 0),
      actualHires: acc.actualHires + (row.actual.hires ?? 0),
    }),
    { targetSub: 0, actualSub: 0, targetHires: 0, actualHires: 0 }
  );

  // Actuals stay read-only here (the new table is a report view). They're
  // still editable on the Dashboard's MonthlyTargetActualTable / Strategy
  // Plan — same underlying recruiterActuals context data either way.
  const handleExport = () => {
    const exportRows: TeamReportRow[] = rows.map((row) => ({
      Recruiter: row.name,
      Team: row.team ? TEAM_LABEL[row.team] : "Unassigned",
      Month: month.label,
      "Target Submissions": row.plan.targetSubmissions ?? "",
      "Actual Submissions": row.actual.submissions ?? "",
      "Target Hires": row.plan.targetHires ?? "",
      "Actual Hires": row.actual.hires ?? "",
      "Hire Rate": hireRateOf(row.actual.hires, row.actual.submissions),
      "States Assigned": row.statesCount,
      "Carriers Assigned": row.plan.carriers.length,
    }));
    exportTeamReportToExcel(exportRows, month.label);
  };

  return (
    <>
      <ReportsHeader />

      <ReportsStats
        targetSub={totals.targetSub}
        actualSub={totals.actualSub}
        targetHires={totals.targetHires}
        actualHires={totals.actualHires}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <MonthlyTrendCard />
        <ManagerInsightsCard />
      </div>

      <div className="-mx-6 mb-4">
        <StatePerformancePanel />
      </div>
      <div className="mb-4">
        <DetailCard />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <StateAssignmentTable />
        <CarrierUsageTable />
      </div>

      <div className="mb-4">
        <RecruiterPerformanceTable
          rows={rows}
          totals={totals}
          months={months}
          monthIdx={monthIdx}
          setMonthIdx={setMonthIdx}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          recruiterColor={recruiterColor}
          onExport={handleExport}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <DataCoveragePanel />
      </div>

      <QuickActionsRow onGenerateReport={handleExport} />
    </>
  );
}
