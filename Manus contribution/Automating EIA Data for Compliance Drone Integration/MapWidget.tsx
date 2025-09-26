"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MapLocation {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: "operating" | "under-construction" | "planned";
  type: "solar" | "wind" | "other";
}

const MapWidget = () => {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Mock location data based on the KMZ files analyzed
  const mockLocations: MapLocation[] = [
    {
      id: "1",
      name: "Desert Sunlight Solar Farm",
      state: "CA",
      latitude: 33.7,
      longitude: -115.4,
      capacity: 690,
      status: "operating",
      type: "solar"
    },
    {
      id: "2",
      name: "Topaz Solar Farm", 
      state: "CA",
      latitude: 35.4,
      longitude: -120.1,
      capacity: 550,
      status: "operating",
      type: "solar"
    },
    {
      id: "3",
      name: "Solar Star Projects",
      state: "CA",
      latitude: 34.9,
      longitude: -118.2,
      capacity: 579,
      status: "operating",
      type: "solar"
    },
    {
      id: "4",
      name: "Copper Mountain Solar",
      state: "NV",
      latitude: 35.7,
      longitude: -114.9,
      capacity: 458,
      status: "operating",
      type: "solar"
    },
    {
      id: "5",
      name: "Agua Caliente Solar",
      state: "AZ",
      latitude: 32.9,
      longitude: -113.3,
      capacity: 397,
      status: "operating",
      type: "solar"
    },
    {
      id: "6",
      name: "Future Solar Project Alpha",
      state: "TX",
      latitude: 31.5,
      longitude: -102.1,
      capacity: 800,
      status: "planned",
      type: "solar"
    }
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 700));
      setLocations(mockLocations);
      setLoading(false);
    };

    fetchLocations();
  }, []);

  const filteredLocations = selectedFilter === "all" 
    ? locations 
    : locations.filter(loc => loc.status === selectedFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operating":
        return "bg-green-500";
      case "under-construction":
        return "bg-yellow-500";
      case "planned":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operating":
        return "🟢";
      case "under-construction":
        return "🟡";
      case "planned":
        return "🔵";
      default:
        return "⚪";
    }
  };

  const statusCounts = {
    operating: locations.filter(loc => loc.status === "operating").length,
    underConstruction: locations.filter(loc => loc.status === "under-construction").length,
    planned: locations.filter(loc => loc.status === "planned").length
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Project Locations
        </h3>
        <Link
          href="/dashboard/map"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Full Map →
        </Link>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark dark:text-white"
        >
          <option value="all">All Projects ({locations.length})</option>
          <option value="operating">Operating ({statusCounts.operating})</option>
          <option value="under-construction">Under Construction ({statusCounts.underConstruction})</option>
          <option value="planned">Planned ({statusCounts.planned})</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mini Map Placeholder */}
          <div className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl">🗺️</div>
                <div className="text-sm text-body-color dark:text-body-color-dark">
                  Interactive Map View
                </div>
              </div>
            </div>
            
            {/* Mock location pins */}
            <div className="absolute left-1/4 top-1/3">
              <div className="h-3 w-3 rounded-full bg-green-500 shadow-lg"></div>
            </div>
            <div className="absolute left-2/3 top-1/2">
              <div className="h-3 w-3 rounded-full bg-green-500 shadow-lg"></div>
            </div>
            <div className="absolute right-1/4 bottom-1/3">
              <div className="h-3 w-3 rounded-full bg-blue-500 shadow-lg"></div>
            </div>
          </div>

          {/* Location List */}
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {filteredLocations.slice(0, 5).map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(location.status)}</span>
                  <div>
                    <div className="font-medium text-black dark:text-white">
                      {location.name}
                    </div>
                    <div className="text-sm text-body-color dark:text-body-color-dark">
                      {location.state} • {location.capacity} MW
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-body-color dark:text-body-color-dark">
                    {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Summary */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h4 className="mb-3 font-medium text-black dark:text-white">
              Project Status Summary
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {statusCounts.operating}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Operating
                </div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {statusCounts.underConstruction}
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  Building
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {statusCounts.planned}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Planned
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWidget;

