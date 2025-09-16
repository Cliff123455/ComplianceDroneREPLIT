import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import sampleData from "../data/sampleAnomalies.json";

// Dynamically import map component to avoid SSR issues
const ThermalMap = dynamic(() => import("../components/ThermalMap"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading map...</div>
});

interface JobData {
  id: string;
  status: 'created' | 'uploading' | 'processing' | 'completed' | 'error';
  fileCount: number;
  processedCount: number;
  anomalyCount?: number;
  location?: string;
  centerCoordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  completedAt?: string | null;
  reportGenerated?: boolean;
}

interface ThermalAnomaly {
  id: string;
  jobId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    lat: number;
    lng: number;
  };
  temperature: number;
  description: string;
  image: string;
  detectedAt: string;
}

const Dashboard: NextPage = () => {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.1627, -115.1656]);
  const [mapZoom, setMapZoom] = useState(10);

  const thermalAnomalies: ThermalAnomaly[] = sampleData.thermalAnomalies as ThermalAnomaly[];
  const anomalyTypes = sampleData.anomalyTypes;
  const severityLevels = sampleData.severityLevels;

  // Load jobs data
  useEffect(() => {
    const loadJobs = async () => {
      try {
        // Load real jobs from API
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const realJobs = await response.json();
          
          // Combine with sample data
          const combinedJobs: JobData[] = [
            ...Object.values(realJobs).map((job: any) => ({
              ...job,
              anomalyCount: thermalAnomalies.filter(a => a.jobId === job.id).length,
              location: job.id === 'job_mfmvv1ks_6mik79tsm' ? 'Nevada Solar Farm' : `Location ${job.id.slice(-4)}`,
              centerCoordinates: { lat: 36.1627, lng: -115.1656 },
              reportGenerated: job.status === 'completed'
            })),
            ...(sampleData.jobsWithAnomalies as JobData[]).filter(sampleJob => 
              !Object.keys(realJobs).includes(sampleJob.id)
            )
          ];
          
          setJobs(combinedJobs);
        } else {
          // Fallback to sample data only
          setJobs(sampleData.jobsWithAnomalies as JobData[]);
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setJobs(sampleData.jobsWithAnomalies as JobData[]);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtered jobs based on status and search
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [jobs, statusFilter, searchTerm]);

  // Get anomalies for selected job or all jobs
  const displayedAnomalies = useMemo(() => {
    if (selectedJob) {
      return thermalAnomalies.filter(anomaly => anomaly.jobId === selectedJob);
    }
    return thermalAnomalies;
  }, [selectedJob, thermalAnomalies]);

  const handleJobSelect = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && job.centerCoordinates) {
      setSelectedJob(jobId);
      setMapCenter([job.centerCoordinates.lat, job.centerCoordinates.lng]);
      setMapZoom(12);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'created': 'bg-gray-100 text-gray-800',
      'uploading': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800', 
      'completed': 'bg-green-100 text-green-800',
      'error': 'bg-red-100 text-red-800'
    };
    
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProgressPercentage = (job: JobData) => {
    if (job.status === 'completed') return 100;
    if (job.fileCount === 0) return 0;
    return Math.round((job.processedCount / job.fileCount) * 100);
  };

  // Stats calculations
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const totalAnomalies = thermalAnomalies.length;
  const criticalAnomalies = thermalAnomalies.filter(a => a.severity === 'critical').length;

  return (
    <>
      <Head>
        <title>Dashboard - ComplianceDrone</title>
        <meta name="description" content="ComplianceDrone thermal inspection dashboard with job tracking and anomaly visualization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="gradient-bg text-white">
        <div className="cd-container">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.png" 
                alt="ComplianceDrone Logo" 
                width={50} 
                height={50}
                priority
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold">ComplianceDrone Dashboard</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="/" className="hover:text-gray-200 transition-colors">Home</a>
              <a href="/upload" className="hover:text-gray-200 transition-colors">Upload</a>
              <a href="#" className="text-gray-300">Dashboard</a>
              <a href="#contact" className="hover:text-gray-200 transition-colors">Contact</a>
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50">
        <div className="cd-container py-8">
          {/* Stats Overview */}
          <div className="cd-grid cd-grid-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-gradient">{totalJobs}</h3>
              <p className="text-gray-600">Total Jobs</p>
            </div>
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-gradient">{completedJobs}</h3>
              <p className="text-gray-600">Completed</p>
            </div>
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-gradient">{totalAnomalies}</h3>
              <p className="text-gray-600">Anomalies Detected</p>
            </div>
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-red-600">{criticalAnomalies}</h3>
              <p className="text-gray-600">Critical Issues</p>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="cd-grid cd-grid-2 gap-8">
            {/* Job Tracking Panel */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gradient">Job Tracking</h2>
                <div className="flex space-x-4">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-compliance-orange focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="created">Created</option>
                    <option value="uploading">Uploading</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="error">Error</option>
                  </select>
                  
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-compliance-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Jobs Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">Job ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Location</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Progress</th>
                      <th className="text-left py-3 px-4 font-semibold">Anomalies</th>
                      <th className="text-left py-3 px-4 font-semibold">Created</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <div className="animate-pulse">Loading jobs...</div>
                        </td>
                      </tr>
                    ) : filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No jobs found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr 
                          key={job.id} 
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            selectedJob === job.id ? 'bg-orange-50' : ''
                          }`}
                          onClick={() => handleJobSelect(job.id)}
                        >
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm">{job.id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm">{job.location || 'Unknown'}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(job.status)}`}>
                              {job.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-compliance-orange h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${getProgressPercentage(job)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {job.processedCount}/{job.fileCount}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              (job.anomalyCount || 0) > 0 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {job.anomalyCount || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">{formatDate(job.createdAt)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              {job.reportGenerated && (
                                <button className="text-compliance-orange hover:text-compliance-peach transition-colors">
                                  📄
                                </button>
                              )}
                              <button className="text-gray-600 hover:text-compliance-orange transition-colors">
                                👁️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Map Panel */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gradient">Thermal Anomaly Map</h2>
                <div className="flex items-center space-x-4">
                  {selectedJob && (
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Show All Jobs
                    </button>
                  )}
                  <span className="text-sm text-gray-600">
                    {displayedAnomalies.length} anomalies
                  </span>
                </div>
              </div>
              
              <ThermalMap 
                anomalies={displayedAnomalies}
                center={mapCenter}
                zoom={mapZoom}
                anomalyTypes={anomalyTypes}
                severityLevels={severityLevels}
                onAnomalyClick={(anomaly) => {
                  console.log('Anomaly clicked:', anomaly);
                }}
              />
            </div>
          </div>

          {/* Anomaly Legend */}
          <div className="card mt-8">
            <h3 className="text-xl font-bold text-gradient mb-4">Anomaly Types & Severity</h3>
            <div className="cd-grid cd-grid-2 gap-6">
              {/* Anomaly Types */}
              <div>
                <h4 className="font-semibold mb-3">Issue Types</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(anomalyTypes).map(([type, config]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.color }}
                      ></div>
                      <span className="text-sm">{config.icon} {config.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity Levels */}
              <div>
                <h4 className="font-semibold mb-3">Severity Levels</h4>
                <div className="space-y-2">
                  {Object.entries(severityLevels).map(([severity, config]) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.color }}
                      ></div>
                      <span className="text-sm capitalize font-medium">{severity}</span>
                      <span className="text-sm text-gray-600">- {config.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;