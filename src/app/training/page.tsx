import { TrainingApp } from "@/components/training/TrainingApp";

export default function TrainingPage() {
  return (
    <main className="w-full px-6 py-6 min-w-0">
      <h1 className="text-xl font-semibold mb-1">Training</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Everything a new recruiter needs for their first week: the basics, every carrier, a checklist and a quiz.
      </p>
      <TrainingApp />
    </main>
  );
}
