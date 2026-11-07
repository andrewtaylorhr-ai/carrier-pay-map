import { ControllerApp } from "@/components/controller/ControllerApp";

export default function ControllerPage() {
  return (
    <main className="w-full px-6 py-6 min-w-0">
      <h1 className="text-xl font-semibold mb-1">Controller</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        New recruiters from first training day to first hire: training, quality control, approval and the dates for each step.
      </p>
      <ControllerApp />
    </main>
  );
}
