import { AgenciesApp } from "@/components/agencies/AgenciesApp";

export default function AgenciesPage() {
  return (
    <main className="w-full px-6 py-6 min-w-0">
      <h1 className="text-xl font-semibold mb-1">Agencies</h1>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4">
        Outside recruiting agencies that find drivers for us, next to our Uzbek and Philippines teams. Add each agency and pick the carriers they recruit for. Carriers only the agencies work (like Barr-Nunn) have their own tab with fleets, hiring states and pay.
      </p>
      <AgenciesApp />
    </main>
  );
}
