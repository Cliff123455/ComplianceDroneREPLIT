"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ComplianceItem {
  id: string;
  plantName: string;
  state: string;
  status: "compliant" | "warning" | "non-compliant";
  lastInspection: string;
  nextInspection: string;
  issues: number;
}

const ComplianceWidget = () => {
  const [complianceData, setComplianceData] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock compliance data
  const mockComplianceData: ComplianceItem[] = [
    {
      id: "1",
      plantName: "Desert Sunlight Solar Farm",
      state: "CA",
      status: "compliant",
      lastInspection: "2024-08-15",
      nextInspection: "2024-11-15",
      issues: 0
    },
    {
      id: "2",
      plantName: "Topaz Solar Farm",
      state: "CA", 
      status: "warning",
      lastInspection: "2024-07-20",
      nextInspection: "2024-10-20",
      issues: 2
    },
    {
      id: "3",
      plantName: "Solar Star Projects",
      state: "CA",
      status: "compliant",
      lastInspection: "2024-09-01",
      nextInspection: "2024-12-01",
      issues: 0
    },
    {
      id: "4",
      plantName: "Copper Mountain Solar",
      state: "NV",
      status: "non-compliant",
      lastInspection: "2024-06-10",
      nextInspection: "2024-09-10",
      issues: 5
    },
    {
      id: "5",
      plantName: "Agua Caliente Solar",
      state: "AZ",
      status: "compliant",
      lastInspection: "2024-08-25",
      nextInspection: "2024-11-25",
      issues: 0
    }
  ];

  useEffect(() => {
    const fetchComplianceData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 900));
      setComplianceData(mockComplianceData);
      setLoading(false);
    };

    fetchComplianceData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "non-compliant":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return "✅";
      case "warning":
        return "⚠️";
      case "non-compliant":
        return "❌";
      default:
        return "❓";
    }
  };

  const complianceStats = {
    total: complianceData.length,
    compliant: complianceData.filter(item => item.status === "compliant").length,
    warning: complianceData.filter(item => item.status === "warning").length,
    nonCompliant: complianceData.filter(item => item.status === "non-compliant").length
  };

  const complianceRate = complianceStats.total > 0 
    ? ((complianceStats.compliant / complianceStats.total) * 100).toFixed(1)
    : "0";

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Compliance Status
        </h3>
        <Link
          href="/dashboard/compliance"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Compliance Overview */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="text-2xl font-bold text-black dark:text-white">
              {complianceRate}%
            </div>
            <div className="text-sm text-body-color dark:text-body-color-dark">
              Overall Compliance Rate
            </div>
            <div className="mt-2 flex space-x-4 text-xs">
              <span className="text-green-600 dark:text-green-400">
                ✅ {complianceStats.compliant} Compliant
              </span>
              <span className="text-yellow-600 dark:text-yellow-400">
                ⚠️ {complianceStats.warning} Warning
              </span>
              <span className="text-red-600 dark:text-red-400">
                ❌ {complianceStats.nonCompliant} Non-compliant
              </span>
            </div>
          </div>

          {/* Recent Compliance Items */}
          <div className="max-h-48 space-y-3 overflow-y-auto">
            {complianceData.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusIcon(item.status)}</span>
                      <h4 className="font-medium text-black dark:text-white">
                        {item.plantName}
                      </h4>
                    </div>
                    <p className="text-sm text-body-color dark:text-body-color-dark">
                      {item.state} • Last: {new Date(item.lastInspection).toLocaleDateString()}
                    </p>
                    {item.issues > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {item.issues} issue{item.issues > 1 ? 's' : ''} found
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Inspections */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h4 className="mb-3 font-medium text-black dark:text-white">
              Upcoming Inspections
            </h4>
            <div className="space-y-2">
              {complianceData
                .filter(item => new Date(item.nextInspection) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                .slice(0, 2)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-body-color dark:text-body-color-dark">
                      {item.plantName}
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {new Date(item.nextInspection).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceWidget;

