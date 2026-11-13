import { PipelineApp } from "@/components/pipeline/PipelineApp";

export default function PipelinePage() {
  return (
    <main className="w-full px-6 py-6 min-w-0">
      <h1 className="text-xl font-semibold mb-1">Driver Pipeline</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Every driver our team submits, read from the no-reply emails: the submissions, the follow-ups, and the drivers with a DQP scheduled. Submissions also fill in the Daily
        Tracker.
      </p>
      <PipelineApp />
    </main>
  );
}
