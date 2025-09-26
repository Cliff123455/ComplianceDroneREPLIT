"use client";

import { useEffect, useMemo, useState } from "react";

interface SolarProject {
  plantCode: string;
  plantName: string;
  state: string;
  primeMover: string;
  capacity?: number;
  operatingYear?: number;
  latestGeneration?: number;
  generationUnits?: string;
}

interface ApiResponse {
  success: boolean;
  data: SolarProject[];
  total: number;
}

const FALLBACK_STATES = ["CA", "TX", "FL", "NY", "NC"];

export default function SolarProjectsWidget() {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProjects() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/eia/plants?limit=200", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as ApiResponse;
        if (!payload.success) {
          throw new Error("Upstream request failed.");
        }
        setProjects(payload.data);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Failed to load solar projects", err);
          setError("Could not load solar project data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();

    return () => controller.abort();
  }, []);

  const stateStats = useMemo(() => {
    if (!projects.length) {
      return FALLBACK_STATES.map((state) => ({ state, count: 0, generation: 0 }));
    }

    const grouped = projects.reduce<Record<string, { count: number; generation: number }>>((acc, project) => {
      const key = project.state || "Unknown";
      if (!acc[key]) {
        acc[key] = { count: 0, generation: 0 };
      }
      acc[key].count += 1;
      acc[key].generation += project.latestGeneration ?? 0;
      return acc;
    }, {});

    const stats = Object.entries(grouped).map(([state, value]) => ({
      state,
      count: value.count,
      generation: value.generation,
    }));

    return stats.sort((a, b) => b.generation - a.generation).slice(0, 10);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedState === "all") {
      return projects.slice(0, 50);
    }
    return projects.filter((project) => project.state === selectedState).slice(0, 50);
  }, [projects, selectedState]);

  return (
    <section className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">Solar Projects</h3>
        <a className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" href="/dashboard/projects">
          View all
        </a>
      </div>

      <div className="mb-4">
        <label className="sr-only" htmlFor="solar-project-state">
          Filter by state
        </label>
        <select
          id="solar-project-state"
          value={selectedState}
          onChange={(event) => setSelectedState(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark dark:text-white"
        >
          <option value="all">All states</option>
          {stateStats.map((stat) => (
            <option key={stat.state} value={stat.state}>
              {stat.state} ({stat.count})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {filteredProjects.map((project) => (
              <article
                key={project.plantCode}
                className="rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <h4 className="font-medium text-black dark:text-white">{project.plantName || "Unnamed facility"}</h4>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  {project.state || "Unknown"} | {project.latestGeneration ? `${project.latestGeneration.toLocaleString()} ${project.generationUnits ?? 'MWh'}` : 'Generation N/A'}
                </p>
                {project.operatingYear && (
                  <p className="text-xs text-body-color dark:text-body-color-dark">Reported period: {project.operatingYear}</p>
                )}
              </article>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h4 className="mb-3 font-medium text-black dark:text-white">Top states by generation</h4>
            <ul className="space-y-2 text-sm">
              {stateStats.slice(0, 3).map((stat) => (
                <li key={stat.state} className="flex items-center justify-between">
                  <span className="text-body-color dark:text-body-color-dark">{stat.state}</span>
                  <span className="font-medium text-black dark:text-white">{Math.round(stat.generation).toLocaleString()} MWh</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}


