import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export default function ReportsPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <h1 className="text-xl font-semibold mb-1">Reports</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Target vs. actual submissions and hires for every recruiter, current + next month. Actuals are entered by
        hand here or on a recruiter&apos;s Strategy Plan — both read and write the same numbers.
      </p>
      <ReportsDashboard />
    </main>
  );
}
