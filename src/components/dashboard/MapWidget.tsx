"use client";

import { useEffect, useMemo, useState } from "react";

interface PlantLocation {
  plantCode: string;
  plantName: string;
  state: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  latestGeneration?: number;
  generationUnits?: string;
}

type StatusKey = "operating" | "under-construction" | "planned";

type ApiResponse = {
  success: boolean;
  data: PlantLocation[];
};

function inferStatus(latestGeneration?: number): StatusKey {
  if (!latestGeneration || latestGeneration <= 0) {
    return "planned";
  }
  if (latestGeneration >= 100000) {
    return "operating";
  }
  if (latestGeneration >= 20000) {
    return "under-construction";
  }
  return "planned";
}

export default function MapWidget() {
  const [locations, setLocations] = useState<(PlantLocation & { status: StatusKey })[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLocations() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/eia/plants?limit=150", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as ApiResponse;
        if (!payload.success) {
          throw new Error("Upstream request failed.");
        }
        const enriched = payload.data.map((plant) => ({
          ...plant,
          status: inferStatus(plant.latestGeneration),
        }));
        setLocations(enriched);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Failed to load map data", err);
          setError("Could not load map data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
    return () => controller.abort();
  }, []);

  const statusCounts = useMemo(() => {
    return locations.reduce(
      (acc, loc) => {
        acc[loc.status] += 1;
        return acc;
      },
      {
        operating: 0,
        "under-construction": 0,
        planned: 0,
      } as Record<StatusKey, number>
    );
  }, [locations]);

  const filtered = useMemo(() => {
    if (selectedStatus === "all") {
      return locations.slice(0, 10);
    }
    return locations.filter((loc) => loc.status === selectedStatus).slice(0, 10);
  }, [locations, selectedStatus]);

  return (
    <section className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">Project Locations</h3>
        <a className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" href="/dashboard/map">
          Full map
        </a>
      </div>

      <div className="mb-4">
        <label className="sr-only" htmlFor="map-status-filter">
          Filter by status
        </label>
        <select
          id="map-status-filter"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark dark:text-white"
        >
          <option value="all">All projects ({locations.length})</option>
          <option value="operating">Operating ({statusCounts.operating})</option>
          <option value="under-construction">Under construction ({statusCounts["under-construction"]})</option>
          <option value="planned">Planned ({statusCounts.planned})</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">Interactive map placeholder</span>
              <span className="text-xs text-body-color dark:text-body-color-dark">Mapbox view forthcoming</span>
            </div>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto">
            {filtered.map((location) => (
              <article
                key={location.plantCode}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-black dark:text-white">{location.plantName || "Unnamed facility"}</p>
                  <p className="text-body-color dark:text-body-color-dark">
                    {location.state || "Unknown"} | {location.latestGeneration ? `${Math.round(location.latestGeneration).toLocaleString()} ${location.generationUnits ?? 'MWh'}` : 'Generation N/A'}
                  </p>
                </div>
                <span className="text-xs uppercase text-gray-600 dark:text-gray-300">{location.status.replace("-", " ")}</span>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/30">
              <p className="text-lg font-bold text-green-600 dark:text-green-300">{statusCounts.operating}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Operating</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/30">
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-300">{statusCounts["under-construction"]}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">Building</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-300">{statusCounts.planned}</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">Planned</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
