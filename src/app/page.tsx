import { AssignedCarriersPanel } from "@/components/carrier-map/AssignedCarriersPanel";
import { ColorModeBar } from "@/components/carrier-map/ColorModeBar";
import { DetailCard } from "@/components/carrier-map/DetailCard";
import { RecruiterManage } from "@/components/carrier-map/RecruiterManage";
import { RecruiterPanel } from "@/components/carrier-map/RecruiterPanel";
import { RecruiterReport } from "@/components/carrier-map/RecruiterReport";
import { RecruiterStrategyPlan } from "@/components/carrier-map/RecruiterStrategyPlan";
import { StatePerformancePanel } from "@/components/carrier-map/StatePerformancePanel";
import { Toolbar } from "@/components/carrier-map/Toolbar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { MonthlyTargetActualTable } from "@/components/dashboard/MonthlyTargetActualTable";
import { TopBar } from "@/components/TopBar";
import { CarrierMapProvider } from "@/lib/carrier-map-context";

export default function Home() {
  return (
    <CarrierMapProvider>
      <TopBar />

      <div className="mx-auto w-full max-w-[1400px] px-6 pt-5">
        <h1 className="text-xl font-semibold mb-1">CDL-A multi-carrier pay &amp; strategy map</h1>
        <p className="text-[13px] text-[#9aa0ad]">
          Pick a carrier and category to see pay by state. Switch to Strategy mode to lock in which carrier each state
          is assigned to for your recruiters.
        </p>
      </div>

      <DashboardStats />

      <div className="mx-auto w-full max-w-[1400px] px-6 pt-4">
        <Toolbar />
        <ColorModeBar />
        <RecruiterManage />
        <RecruiterPanel />
        <div className="flex flex-col lg:flex-row gap-3 items-start">
          <div className="flex-1 min-w-0">
            <RecruiterStrategyPlan />
          </div>
          <AssignedCarriersPanel />
        </div>
        <MonthlyTargetActualTable />
      </div>

      <StatePerformancePanel />

      <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
        <DetailCard />
        <RecruiterReport />
      </div>
    </CarrierMapProvider>
  );
}
