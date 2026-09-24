import { CatNote } from "@/components/carrier-map/CatNote";
import { ChoroplethMap } from "@/components/carrier-map/ChoroplethMap";
import { ColorModeBar } from "@/components/carrier-map/ColorModeBar";
import { DetailCard } from "@/components/carrier-map/DetailCard";
import { Legend } from "@/components/carrier-map/Legend";
import { RecruiterManage } from "@/components/carrier-map/RecruiterManage";
import { RecruiterPanel } from "@/components/carrier-map/RecruiterPanel";
import { RecruiterReport } from "@/components/carrier-map/RecruiterReport";
import { Toolbar } from "@/components/carrier-map/Toolbar";
import { CarrierMapProvider } from "@/lib/carrier-map-context";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <h1 className="text-xl font-semibold mb-1">CDL-A multi-carrier pay &amp; strategy map</h1>
      <p className="text-[13px] text-[#9aa0ad] mb-4">
        Pick a carrier and category to see pay by state. Switch to Strategy mode to lock in which carrier each state is
        assigned to for your recruiters.
      </p>

      <CarrierMapProvider>
        <Toolbar />
        <ColorModeBar />
        <RecruiterManage />
        <RecruiterPanel />
        <ChoroplethMap />
        <Legend />
        <CatNote />
        <DetailCard />
        <RecruiterReport />
      </CarrierMapProvider>
    </main>
  );
}
