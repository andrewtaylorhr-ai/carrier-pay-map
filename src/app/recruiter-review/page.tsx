import { RecruiterReviewApp } from "@/components/recruiter-review/RecruiterReviewApp";

export default function RecruiterReviewPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <h1 className="text-xl font-semibold mb-1">Recruiter Review</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Upload the Performance workbook to see which recruiters&apos; hires actually stuck over the trailing 6
        months — and which ones need a follow-up call.
      </p>
      <RecruiterReviewApp />
    </main>
  );
}
