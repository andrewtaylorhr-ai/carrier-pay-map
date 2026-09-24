import { ActivityApp } from "@/components/activity/ActivityApp";

export default function ActivityPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <h1 className="text-xl font-semibold mb-1">Carrier Activity</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Upload driver-update workbooks per carrier to see submission volume by account and recruiter, and compare
        carriers against each other to figure out which ones are worth working.
      </p>
      <ActivityApp />
    </main>
  );
}
