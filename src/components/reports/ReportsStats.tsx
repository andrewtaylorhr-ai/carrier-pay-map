"use client";

import { Award, Percent, Target, TrendingUp, Trophy, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RadialStatCard } from "@/components/shared/RadialStatCard";

// Real numbers only — summed from recruiterActuals/recruiterPlans for the
// selected month + team filter (same totals reducer the old ReportsDashboard
// table used). The three percentage cards use the radial-gauge treatment
// (matching the reference mockup's ring-style stat cards); they're null
// (empty ring, "—") when there's no denominator to divide by, same
// "don't divide by nothing" convention as hireRateOf() elsewhere.
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
  const hireRatePct = actualSub > 0 ? (actualHires / actualSub) * 100 : null;
  const subAchievementPct = targetSub > 0 ? (actualSub / targetSub) * 100 : null;
  const hireAchievementPct = targetHires > 0 ? (actualHires / targetHires) * 100 : null;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <StatCard icon={Users} label="Total submissions" value={actualSub > 0 ? String(actualSub) : "—"} sub="Actual, this month" color="blue" />
      <StatCard icon={Award} label="Total hires" value={actualHires > 0 ? String(actualHires) : "—"} sub="Actual, this month" color="purple" />
      <StatCard icon={Target} label="Submission target" value={targetSub > 0 ? String(targetSub) : "—"} sub="Sum of recruiter plans" color="amber" />
      <RadialStatCard icon={Percent} label="Hire rate" pct={hireRatePct} sub="Hires ÷ submissions" color="green" />
      <RadialStatCard icon={TrendingUp} label="Submission achievement" pct={subAchievementPct} sub="Actual vs. target" color="blue" />
      <RadialStatCard icon={Trophy} label="Hire achievement" pct={hireAchievementPct} sub="Actual vs. target" color="purple" />
    </div>
  );
}
