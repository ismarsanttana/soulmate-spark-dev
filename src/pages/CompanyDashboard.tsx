import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ContextBar } from "@/components/dashboard/ContextBar";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RealTimeMonitors } from "@/components/dashboard/RealTimeMonitors";
import { RequestsChart } from "@/components/dashboard/RequestsChart";
import { CitiesTable } from "@/components/dashboard/CitiesTable";
import { JobsCard } from "@/components/dashboard/JobsCard";
import { TeamCard } from "@/components/dashboard/TeamCard";
import { PartnersCard } from "@/components/dashboard/PartnersCard";

export default function CompanyDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />
      <ContextBar />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <SummaryCards />

          {/* Main Grid - 2 columns on larger screens */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RealTimeMonitors />
            <RequestsChart />
          </div>

          {/* Cities Table - Full width */}
          <CitiesTable />

          {/* Bottom Grid - 3 columns on larger screens */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <JobsCard />
            <TeamCard />
            <PartnersCard />
          </div>
        </div>
      </main>
    </div>
  );
}
