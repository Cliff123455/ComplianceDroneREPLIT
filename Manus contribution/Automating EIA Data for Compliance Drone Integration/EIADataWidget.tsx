"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EIADataPoint {
  period: string;
  value: number;
  state?: string;
  type: string;
}

const EIADataWidget = () => {
  const [data, setData] = useState<EIADataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>("generation");

  // Mock EIA data based on real API structure
  const mockData: EIADataPoint[] = [
    { period: "2024-06", value: 15420, type: "generation" },
    { period: "2024-05", value: 14890, type: "generation" },
    { period: "2024-04", value: 13650, type: "generation" },
    { period: "2024-03", value: 12340, type: "generation" },
    { period: "2024-02", value: 11200, type: "generation" },
    { period: "2024-01", value: 10800, type: "generation" }
  ];

  const metrics = [
    { id: "generation", name: "Solar Generation", unit: "GWh" },
    { id: "capacity", name: "Installed Capacity", unit: "MW" },
    { id: "plants", name: "Active Plants", unit: "count" }
  ];

  useEffect(() => {
    const fetchEIAData = async () => {
      setLoading(true);
      // Simulate API call to EIA
      await new Promise(resolve => setTimeout(resolve, 800));
      setData(mockData);
      setLoading(false);
    };

    fetchEIAData();
  }, [selectedMetric]);

  const currentMetric = metrics.find(m => m.id === selectedMetric);
  const latestValue = data[0]?.value || 0;
  const previousValue = data[1]?.value || 0;
  const changePercent = previousValue > 0 
    ? ((latestValue - previousValue) / previousValue * 100).toFixed(1)
    : "0";

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">
          EIA Live Data
        </h3>
        <Link
          href="/dashboard/eia"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View Details →
        </Link>
      </div>

      {/* Metric Selector */}
      <div className="mb-4">
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark dark:text-white"
        >
          {metrics.map(metric => (
            <option key={metric.id} value={metric.id}>
              {metric.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Value */}
          <div>
            <div className="text-3xl font-bold text-black dark:text-white">
              {latestValue.toLocaleString()} {currentMetric?.unit}
            </div>
            <div className="flex items-center text-sm">
              <span className={`mr-1 ${
                parseFloat(changePercent) >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {parseFloat(changePercent) >= 0 ? "↗" : "↘"} {Math.abs(parseFloat(changePercent))}%
              </span>
              <span className="text-body-color dark:text-body-color-dark">
                vs last month
              </span>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-end justify-between space-x-1">
              {data.slice(0, 6).reverse().map((point, index) => {
                const maxValue = Math.max(...data.map(d => d.value));
                const height = (point.value / maxValue) * 100;
                
                return (
                  <div key={point.period} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-600 to-orange-600"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                      {point.period.split('-')[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Updates */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h4 className="mb-3 font-medium text-black dark:text-white">
              Recent Updates
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-body-color dark:text-body-color-dark">
                  Data last updated
                </span>
                <span className="font-medium text-black dark:text-white">
                  2 hours ago
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-body-color dark:text-body-color-dark">
                  Next sync
                </span>
                <span className="font-medium text-black dark:text-white">
                  In 1 hour
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-body-color dark:text-body-color-dark">
                  API Status
                </span>
                <span className="inline-flex items-center">
                  <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Active
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EIADataWidget;

