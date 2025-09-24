import type { Metadata } from "next";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getComplianceData } from "@/libs/eia";

import ComplianceDashboardClient from "./ComplianceDashboardClient";

export const metadata: Metadata = {
  title: "Compliance | Compliance Drone",
  description: "Detailed compliance monitoring for energy infrastructure facilities managed by Compliance Drone.",
};

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const initialRecords = await getComplianceData();

  return (
    <DashboardLayout>
      <ComplianceDashboardClient initialRecords={initialRecords} />
    </DashboardLayout>
  );
}
