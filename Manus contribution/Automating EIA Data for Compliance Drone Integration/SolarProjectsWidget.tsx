"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SolarProject {
  id: string;
  name: string;
  state: string;
  capacity: number;
  technology: string;
  status: string;
  operatingYear?: number;
  latitude?: number;
  longitude?: number;
}

const SolarProjectsWidget = () => {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>("all");

  // Mock data based on the analyzed solar project files
  const mockProjects: SolarProject[] = [
    {
      id: "1",
      name: "Desert Sunlight Solar Farm",
      state: "CA",
      capacity: 690.0,
      technology: "Solar Photovoltaic",
      status: "Operating",
      operatingYear: 2015,
      latitude: 33.7,
      longitude: -115.4
    },
    {
      id: "2", 
      name: "Topaz Solar Farm",
      state: "CA",
      capacity: 550.0,
      technology: "Solar Photovoltaic",
      status: "Operating",
      operatingYear: 2014,
      latitude: 35.4,
      longitude: -120.1
    },
    {
      id: "3",
      name: "Solar Star Projects",
      state: "CA", 
      capacity: 579.0,
      technology: "Solar Photovoltaic",
      status: "Operating",
      operatingYear: 2015,
      latitude: 34.9,
      longitude: -118.2
    },
    {
      id: "4",
      name: "Copper Mountain Solar",
      state: "NV",
      capacity: 458.0,
      technology: "Solar Photovoltaic", 
      status: "Operating",
      operatingYear: 2016,
      latitude: 35.7,
      longitude: -114.9
    },
    {
      id: "5",
      name: "Agua Caliente Solar",
      state: "AZ",
      capacity: 397.0,
      technology: "Solar Photovoltaic",
      status: "Operating", 
      operatingYear: 2014,
      latitude: 32.9,
      longitude: -113.3
    }
  ];

  const stateStats = [
    { state: "CA", count: 997, capacity: "15.2 GW" },
    { state: "NC", count: 790, capacity: "8.1 GW" },
    { state: "MN", count: 687, capacity: "3.2 GW" },
    { state: "NY", count: 536, capacity: "4.8 GW" },
    { state: "MA", count: 520, capacity: "3.9 GW" }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchProjects = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProjects(mockProjects);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const filteredProjects = selectedState === "all" 
    ? projects 
    : projects.filter(p => p.state === selectedState);

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Solar Projects
        </h3>
        <Link
          href="/dashboard/projects"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View All →
        </Link>
      </div>

      {/* State Filter */}
      <div className="mb-4">
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark dark:text-white"
        >
          <option value="all">All States</option>
          {stateStats.map(stat => (
            <option key={stat.state} value={stat.state}>
              {stat.state} ({stat.count} projects)
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Project List */}
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-black dark:text-white">
                      {project.name}
                    </h4>
                    <p className="text-sm text-body-color dark:text-body-color-dark">
                      {project.state} • {project.capacity} MW • {project.technology}
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === "Operating"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}>
                        {project.status}
                      </span>
                      {project.operatingYear && (
                        <span className="text-xs text-body-color dark:text-body-color-dark">
                          Since {project.operatingYear}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* State Statistics */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h4 className="mb-3 font-medium text-black dark:text-white">
              Top Solar States
            </h4>
            <div className="space-y-2">
              {stateStats.slice(0, 3).map((stat) => (
                <div key={stat.state} className="flex items-center justify-between text-sm">
                  <span className="text-body-color dark:text-body-color-dark">
                    {stat.state}
                  </span>
                  <div className="text-right">
                    <div className="font-medium text-black dark:text-white">
                      {stat.count} projects
                    </div>
                    <div className="text-xs text-body-color dark:text-body-color-dark">
                      {stat.capacity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarProjectsWidget;

