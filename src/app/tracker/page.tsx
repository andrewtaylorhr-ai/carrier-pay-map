import { TrackerApp } from "@/components/tracker/TrackerApp";

export default function TrackerPage() {
  return (
    <main className="w-full px-6 py-6 min-w-0">
      <h1 className="text-xl font-semibold mb-1">Daily Tracker</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Each recruiter&apos;s daily submissions, weekly hires and attendance for the month.
      </p>
      <TrackerApp />
    </main>
  );
}
