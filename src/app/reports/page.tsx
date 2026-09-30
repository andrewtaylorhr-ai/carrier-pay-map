import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { TopBar } from "@/components/TopBar";

// Reports gets its own light "Executive Dashboard" surface (see .app-light in
// globals.css) instead of the rest of the app's dark Class A Recruiting
// theme — the user asked for this page specifically to match a light mockup.
// Scoped to this page only via a wrapper class (CSS custom properties
// inherit, so nesting overrides every var(--cpm-*) used below it) rather
// than flipping the whole app, so the Dashboard/map page is untouched.
export default function ReportsPage() {
  return (
    <div className="app-light min-h-full flex-1 flex flex-col bg-[var(--cpm-bg)] text-[var(--cpm-text)]">
      <TopBar />
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <ReportsDashboard />
      </main>
    </div>
  );
}
