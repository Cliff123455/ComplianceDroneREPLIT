import { Metadata } from "next";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EIADataWidget from "@/components/Dashboard/EIADataWidget";
import SolarProjectsWidget from "@/components/Dashboard/SolarProjectsWidget";
import ComplianceWidget from "@/components/Dashboard/ComplianceWidget";
import MapWidget from "@/components/Dashboard/MapWidget";

export const metadata: Metadata = {
  title: "Dashboard - Compliance Drone",
  description: "Energy infrastructure management dashboard with real-time EIA data and solar project monitoring.",
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Energy Infrastructure Dashboard
          </h1>
          <p className="mt-2 text-body-color dark:text-body-color-dark">
            Real-time monitoring and compliance tracking for energy infrastructure projects
          </p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Total Plants
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  12,709
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <div className="h-6 w-6 rounded bg-blue-600"></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Solar Facilities
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  6,698
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <div className="h-6 w-6 rounded bg-orange-600"></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Total Capacity
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  113.1 GW
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <div className="h-6 w-6 rounded bg-green-600"></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Compliance Rate
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  98.5%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <div className="h-6 w-6 rounded bg-purple-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Widgets */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* EIA Data Widget */}
          <EIADataWidget />
          
          {/* Solar Projects Widget */}
          <SolarProjectsWidget />
        </div>

        {/* Secondary Widgets Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Compliance Widget */}
          <ComplianceWidget />
          
          {/* Map Widget */}
          <MapWidget />
        </div>
      </div>
    </DashboardLayout>
  );
}

