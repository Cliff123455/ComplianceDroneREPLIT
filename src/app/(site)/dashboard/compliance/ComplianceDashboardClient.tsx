"use client";

import { useMemo, useState } from "react";

import type { ComplianceRecord, ComplianceStatus } from "@/hooks/useComplianceData";
import { useComplianceData } from "@/hooks/useComplianceData";

interface ComplianceDashboardClientProps {
  initialRecords: ComplianceRecord[];
}

const STATUS_FILTERS: Array<{ label: string; value: "all" | ComplianceStatus }> = [
  { label: "All statuses", value: "all" },
  { label: "Compliant", value: "Compliant" },
  { label: "Warning", value: "Warning" },
  { label: "Non-compliant", value: "Non-compliant" },
];

export default function ComplianceDashboardClient({ initialRecords }: ComplianceDashboardClientProps) {
  const { records, loading, refreshing, error, stats, refresh } = useComplianceData(initialRecords);

  const [statusFilter, setStatusFilter] = useState<"all" | ComplianceStatus>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const states = useMemo(() => {
    const unique = new Set<string>();
    records.forEach((record) => {
      if (record.state) {
        unique.add(record.state);
      }
    });
    return Array.from(unique).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return records
      .filter((record) => {
        if (statusFilter !== "all" && record.complianceStatus !== statusFilter) {
          return false;
        }
        if (stateFilter !== "all" && record.state !== stateFilter) {
          return false;
        }
        if (query && !`${record.plantName} ${record.plantCode} ${record.state}`.toLowerCase().includes(query)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.nextInspection).getTime();
        const bTime = new Date(b.nextInspection).getTime();
        return aTime - bTime;
      });
  }, [records, statusFilter, stateFilter, searchTerm]);

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return records.filter((record) => new Date(record.nextInspection).getTime() < now).length;
  }, [records]);

  const attentionCount = stats.totals.warning + stats.totals.nonCompliant;
  const percentFormatter = useMemo(() => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }), []);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }), []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Compliance Overview</h1>
          <p className="mt-2 max-w-2xl text-body-color dark:text-body-color-dark">
            Track facility compliance status, upcoming inspections, and open issues across your monitored sites.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="text-sm text-body-color dark:text-body-color-dark" role="status">
              Refreshing...
            </span>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Refresh data
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg bg-white p-5 shadow-lg dark:bg-dark">
          <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Total facilities</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{stats.total}</p>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-lg dark:bg-dark">
          <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Compliance rate</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{percentFormatter.format(stats.complianceRate)}%</p>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-lg dark:bg-dark">
          <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Needs attention</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{attentionCount}</p>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-lg dark:bg-dark">
          <p className="text-sm font-medium text-body-color dark:text-body-color-dark">Overdue inspections</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{overdueCount}</p>
        </article>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col text-sm font-medium text-body-color dark:text-body-color-dark">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | ComplianceStatus)}
                className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-dark-2 dark:text-white"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-body-color dark:text-body-color-dark">
              State
              <select
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
                className="mt-1 min-w-[8rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-dark-2 dark:text-white"
              >
                <option value="all">All states</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex w-full max-w-md items-center gap-3">
            <label className="relative flex-1 text-sm font-medium text-body-color dark:text-body-color-dark">
              <span className="sr-only">Search facilities</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, code, or state"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-dark-2 dark:text-white"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-md border border-red-400 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          ) : filteredRecords.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-body-color dark:border-gray-700 dark:text-body-color-dark">
              No facilities match your filters.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th scope="col" className="px-4 py-3">Facility</th>
                  <th scope="col" className="px-4 py-3">State</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Issues</th>
                  <th scope="col" className="px-4 py-3">Last inspection</th>
                  <th scope="col" className="px-4 py-3">Next inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => {
                  const nextInspectionDate = new Date(record.nextInspection).getTime();
                  const isOverdue = nextInspectionDate < Date.now();
                  return (
                    <tr key={record.plantCode} className="text-sm text-body-color dark:text-body-color-dark">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-black dark:text-white">{record.plantName}</div>
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{record.plantCode}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{record.state}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            record.complianceStatus === "Compliant"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : record.complianceStatus === "Warning"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {record.complianceStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{record.issues}</td>
                      <td className="whitespace-nowrap px-4 py-3">{dateFormatter.format(new Date(record.lastInspection))}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={isOverdue ? "font-semibold text-red-600 dark:text-red-400" : ""}>
                          {dateFormatter.format(new Date(record.nextInspection))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
