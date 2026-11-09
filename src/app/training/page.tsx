import { TrainingApp } from "@/components/training/TrainingApp";

export default function TrainingPage() {
  return (
    <main className="w-full px-6 py-6 min-w-0">
      <h1 className="text-xl font-semibold mb-1">Training</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Run the training for each new recruiter: tick off their program, record their quiz and the calls you listen to in quality
        control, then move them on. The other tabs are the material to teach from.
      </p>
      <TrainingApp />
    </main>
  );
}
