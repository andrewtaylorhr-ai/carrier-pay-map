import { Award, Percent, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { MonthlyTrendCard } from "./MonthlyTrendCard";

// No submissions/hires tracking data source exists in this app yet (it's a
// pay-map + manual carrier/recruiter assignment tool, not a pipeline
// tracker) — these stay honest "No data yet" placeholders rather than
// fabricated numbers, matching the same zero-state convention already used
// in the Carrier Activity dashboard.
export function DashboardStats() {
  return (
    <div className="flex flex-wrap gap-3 px-6 pt-4">
      <StatCard icon={Users} label="Total submissions" value="—" sub="No data yet" />
      <StatCard icon={Award} label="Total hires" value="—" sub="No data yet" />
      <StatCard icon={Percent} label="Hire rate" value="—" sub="No data yet" />
      <MonthlyTrendCard />
    </div>
  );
}
