"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useComplianceData } from "@/hooks/useComplianceData";

export default function ComplianceWidget() {
  const { records, loading, refreshing, error, stats } = useComplianceData();

  const previewRecords = useMemo(() => records.slice(0, 4), [records]);
  const isInitialLoading = loading && records.length === 0;
  const complianceRateLabel = useMemo(() => stats.complianceRate.toFixed(1), [stats.complianceRate]);

  return (
    <section className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">Compliance Status</h3>
        <Link
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          href="/dashboard/compliance"
        >
          View all
        </Link>
      </div>

      {isInitialLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-black dark:text-white">{complianceRateLabel}%</p>
                <p className="text-sm text-body-color dark:text-body-color-dark">Overall compliance rate</p>
              </div>
              {refreshing && (
                <span className="text-xs text-body-color dark:text-body-color-dark" role="status">
                  Updating...
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <span className="text-green-600 dark:text-green-400">Compliant: {stats.totals.compliant}</span>
              <span className="text-yellow-600 dark:text-yellow-400">Warning: {stats.totals.warning}</span>
              <span className="text-red-600 dark:text-red-400">Non-compliant: {stats.totals.nonCompliant}</span>
            </div>
          </div>

          <div className="max-h-48 space-y-3 overflow-y-auto">
            {previewRecords.map((item) => (
              <article
                key={item.plantCode}
                className="rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-black dark:text-white">{item.plantName}</h4>
                    <p className="text-sm text-body-color dark:text-body-color-dark">
                      {item.state} | Last inspection {new Date(item.lastInspection).toLocaleDateString()}
                    </p>
                    {item.issues > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {item.issues} issue{item.issues > 1 ? "s" : ""} noted
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      item.complianceStatus === "Compliant"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : item.complianceStatus === "Warning"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {item.complianceStatus}
                  </span>
                </div>
              </article>
            ))}

            {!previewRecords.length && (
              <p className="rounded border border-dashed border-gray-300 p-3 text-center text-sm text-body-color dark:border-gray-700 dark:text-body-color-dark">
                Compliance records will appear here when available.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
