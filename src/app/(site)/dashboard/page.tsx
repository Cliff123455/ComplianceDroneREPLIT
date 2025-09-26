import type { Metadata } from "next";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ComplianceWidget from "@/components/dashboard/ComplianceWidget";
import EIADataWidget from "@/components/dashboard/EIADataWidget";
import MapWidget from "@/components/dashboard/MapWidget";
import SolarProjectsWidget from "@/components/dashboard/SolarProjectsWidget";
import { getComplianceData, getSolarPlantSummary, getSolarPlants } from "@/libs/eia";

export const metadata: Metadata = {
  title: "Dashboard | Compliance Drone",
  description: "Operational dashboard for Compliance Drone with live EIA insights and compliance tracking.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [plantSummary, plantSample, complianceRecords] = await Promise.all([
    getSolarPlantSummary(),
    getSolarPlants(undefined, 200),
    getComplianceData(),
  ]);

  const totalPlants = plantSummary.total;
  const totalGenerationMWh = plantSample.reduce((sum, plant) => sum + (plant.latestGeneration ?? 0), 0);
  const solarFacilities = plantSample.length;
  const compliantCount = complianceRecords.filter((item) => item.complianceStatus === "Compliant").length;
  const complianceRate = complianceRecords.length
    ? (compliantCount / complianceRecords.length) * 100
    : 0;
  const generationUnit = plantSample[0]?.generationUnits ?? (plantSummary.generationUnit as string | undefined) ?? "megawatthours";
  const totalGenerationGWh = generationUnit.toLowerCase().startsWith("mega") ? totalGenerationMWh / 1000 : totalGenerationMWh;

  const numberFormatter = new Intl.NumberFormat("en-US");
  const energyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">Energy Infrastructure Dashboard</h1>
          <p className="mt-2 text-body-color dark:text-body-color-dark">
            Real-time monitoring and compliance tracking for energy infrastructure projects.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Total plants (EIA)</p>
                <p className="text-2xl font-bold text-black dark:text-white">{numberFormatter.format(totalPlants)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30" aria-hidden />
            </div>
          </article>

          <article className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Solar facilities (sample)</p>
                <p className="text-2xl font-bold text-black dark:text-white">{numberFormatter.format(solarFacilities)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30" aria-hidden />
            </div>
          </article>

          <article className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Generation (sample)</p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {energyFormatter.format(totalGenerationGWh)} {generationUnit.toLowerCase().startsWith("mega") ? "GWh" : generationUnit}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30" aria-hidden />
            </div>
          </article>

          <article className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Compliance rate</p>
                <p className="text-2xl font-bold text-black dark:text-white">{complianceRate.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30" aria-hidden />
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <EIADataWidget />
          <SolarProjectsWidget />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ComplianceWidget />
          <MapWidget />
        </section>
      </div>
    </DashboardLayout>
  );
}
