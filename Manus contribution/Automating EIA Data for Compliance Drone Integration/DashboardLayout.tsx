"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: "📊"
  },
  {
    name: "EIA Data",
    href: "/dashboard/eia",
    icon: "⚡"
  },
  {
    name: "Solar Projects",
    href: "/dashboard/projects",
    icon: "☀️"
  },
  {
    name: "Compliance",
    href: "/dashboard/compliance",
    icon: "✅"
  },
  {
    name: "Map View",
    href: "/dashboard/map",
    icon: "🗺️"
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: "📋"
  }
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-2">
      {/* Dashboard Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-600 to-orange-600"></div>
                <span className="ml-2 text-xl font-bold text-black dark:text-white">
                  Compliance Drone
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="rounded-lg bg-gradient-to-r from-blue-600 to-orange-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-orange-700">
                Export Data
              </button>
              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="py-6">
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 dark:from-blue-900/20 dark:to-orange-900/20 dark:text-blue-400"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 py-6 pl-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

