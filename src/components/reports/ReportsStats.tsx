"use client";

import { Award, Percent, Target, TrendingUp, Trophy, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

// Real numbers only — summed from recruiterActuals/recruiterPlans for the
// selected month + team filter (same totals reducer the old ReportsDashboard
// table used). Achievement % cards are "—" when there's no target set yet,
// same "don't divide by nothing" convention as hireRateOf() elsewhere.
export function ReportsStats({
  targetSub,
  actualSub,
  targetHires,
  actualHires,
}: {
  targetSub: number;
  actualSub: number;
  targetHires: number;
  actualHires: number;
}) {
  const hireRate = actualSub > 0 ? `${Math.round((actualHires / actualSub) * 100)}%` : "—";
  const subAchievement = targetSub > 0 ? `${Math.round((actualSub / targetSub) * 100)}%` : "—";
  const hireAchievement = targetHires > 0 ? `${Math.round((actualHires / targetHires) * 100)}%` : "—";

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <StatCard icon={Users} label="Total submissions" value={actualSub > 0 ? String(actualSub) : "—"} sub="Actual, this month" />
      <StatCard icon={Award} label="Total hires" value={actualHires > 0 ? String(actualHires) : "—"} sub="Actual, this month" />
      <StatCard icon={Percent} label="Hire rate" value={hireRate} sub="Hires ÷ submissions" />
      <StatCard icon={Target} label="Submission target" value={targetSub > 0 ? String(targetSub) : "—"} sub="Sum of recruiter plans" />
      <StatCard icon={TrendingUp} label="Submission achievement" value={subAchievement} sub="Actual vs. target" />
      <StatCard icon={Trophy} label="Hire achievement" value={hireAchievement} sub="Actual vs. target" />
    </div>
  );
}
