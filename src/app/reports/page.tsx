import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { TopBar } from "@/components/TopBar";

export default function ReportsPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <ReportsDashboard />
      </main>
    </>
  );
}
