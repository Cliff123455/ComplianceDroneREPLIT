// ComplianceDrone Pilot Profile Page
// Displays pilot information, status, and performance metrics

import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getPilotStatusColor, getPilotStatusText } from "../lib/authUtils";

interface PilotProfile {
  id: string;
  userId: string;
  companyName?: string;
  businessType: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  part107Certified: boolean;
  part107Number?: string;
  licenseExpiryDate?: string;
  thermalExperienceYears?: number;
  totalFlightHours?: number;
  droneModels?: string[];
  thermalCameraModels?: string[];
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  liabilityCoverage?: number;
  serviceStates?: string[];
  maxTravelDistance?: number;
  status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended';
  completedJobs: number;
  averageRating?: number;
  totalEarnings: number;
  applicationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const Profile: NextPage = () => {
  const { user, isLoading, isAuthenticated, isPilot, logout } = useAuth();
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading]);

  // Load pilot profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !isPilot) return;

      try {
        const response = await fetch('/api/auth/pilot-profile');
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
        } else if (response.status === 404) {
          // No pilot profile found - this is OK, user can register
          setProfile(null);
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Network error loading profile');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, isPilot]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          message: 'Your application is under review. We\'ll notify you once it\'s approved.',
          action: null
        };
      case 'approved':
        return {
          message: 'Your application has been approved! You can now accept thermal inspection jobs.',
          action: { text: 'Browse Jobs', href: '/dashboard' }
        };
      case 'active':
        return {
          message: 'You\'re an active pilot. Keep up the great work!',
          action: { text: 'View Jobs', href: '/dashboard' }
        };
      case 'inactive':
        return {
          message: 'Your account is currently inactive. Contact support to reactivate.',
          action: { text: 'Contact Support', href: '#contact' }
        };
      case 'suspended':
        return {
          message: 'Your account has been suspended. Please contact support for assistance.',
          action: { text: 'Contact Support', href: '#contact' }
        };
      default:
        return {
          message: 'Status unknown',
          action: null
        };
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pilot Profile - ComplianceDrone</title>
        <meta name="description" content="Your ComplianceDrone pilot profile and dashboard" />
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
              <h1 className="text-2xl font-bold">ComplianceDrone</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="hover:text-gray-200 transition-colors">
                Dashboard
              </Link>
              <Link href="/upload" className="hover:text-gray-200 transition-colors">
                Upload
              </Link>
              <div className="flex items-center space-x-3">
                {user?.profileImageUrl && (
                  <Image
                    src={user.profileImageUrl}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <span className="text-sm">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </span>
                <button
                  onClick={logout}
                  className="text-sm hover:text-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="cd-container">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Pilot Profile</h2>
            <p className="text-gray-600">Manage your professional thermal inspection pilot account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!isPilot && !profile ? (
            <div className="card text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ComplianceDrone!</h3>
                <p className="text-gray-600 mb-6">
                  You're not yet registered as a pilot. Complete your application to start earning with thermal inspections.
                </p>
                <Link href="/register" className="btn-primary text-lg px-8 py-4">
                  Become a Pilot
                </Link>
              </div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Account Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPilotStatusColor(profile.status)}`}>
                    {getPilotStatusText(profile.status)}
                  </span>
                </div>
                
                {(() => {
                  const statusInfo = getStatusMessage(profile.status);
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 mb-3">{statusInfo.message}</p>
                      {statusInfo.action && (
                        <Link href={statusInfo.action.href} className="btn-secondary">
                          {statusInfo.action.text}
                        </Link>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Performance Metrics */}
              <div className="cd-grid cd-grid-3 gap-6">
                <div className="card text-center">
                  <h4 className="text-3xl font-bold text-gradient">{profile.completedJobs}</h4>
                  <p className="text-gray-600">Jobs Completed</p>
                </div>
                <div className="card text-center">
                  <h4 className="text-3xl font-bold text-gradient">
                    {profile.averageRating ? `${profile.averageRating}.0` : 'N/A'}
                  </h4>
                  <p className="text-gray-600">Average Rating</p>
                </div>
                <div className="card text-center">
                  <h4 className="text-3xl font-bold text-gradient">
                    {formatCurrency(profile.totalEarnings)}
                  </h4>
                  <p className="text-gray-600">Total Earnings</p>
                </div>
              </div>

              {/* Profile Information */}
              <div className="cd-grid cd-grid-2 gap-6">
                {/* Business Info */}
                <div className="card">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Business Information</h3>
                  <div className="space-y-3">
                    {profile.companyName && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-gray-900">{profile.companyName}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Type</label>
                      <p className="text-gray-900 capitalize">{profile.businessType}</p>
                    </div>
                    {profile.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-gray-900">
                          {profile.city}, {profile.state} {profile.zipCode}
                        </p>
                      </div>
                    )}
                    {profile.phoneNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{profile.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Qualifications */}
                <div className="card">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Qualifications</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Part 107 Certified</label>
                      <p className="text-gray-900">
                        {profile.part107Certified ? (
                          <span className="flex items-center space-x-2">
                            <span className="text-green-600">✓ Yes</span>
                            {profile.part107Number && (
                              <span className="text-sm text-gray-500">#{profile.part107Number}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-red-600">✗ No</span>
                        )}
                      </p>
                    </div>
                    {profile.thermalExperienceYears !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Thermal Experience</label>
                        <p className="text-gray-900">{profile.thermalExperienceYears} years</p>
                      </div>
                    )}
                    {profile.totalFlightHours !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Flight Hours</label>
                        <p className="text-gray-900">{profile.totalFlightHours} hours</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Equipment */}
                <div className="card">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Equipment</h3>
                  <div className="space-y-3">
                    {profile.droneModels && profile.droneModels.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Drone Models</label>
                        <ul className="text-gray-900 text-sm">
                          {profile.droneModels.map((model, index) => (
                            <li key={index}>• {model}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {profile.thermalCameraModels && profile.thermalCameraModels.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Thermal Cameras</label>
                        <ul className="text-gray-900 text-sm">
                          {profile.thermalCameraModels.map((camera, index) => (
                            <li key={index}>• {camera}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Area */}
                <div className="card">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Service Coverage</h3>
                  <div className="space-y-3">
                    {profile.serviceStates && profile.serviceStates.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Service States</label>
                        <p className="text-gray-900">{profile.serviceStates.join(', ')}</p>
                      </div>
                    )}
                    {profile.maxTravelDistance && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Max Travel Distance</label>
                        <p className="text-gray-900">{profile.maxTravelDistance} miles</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              {profile.hasInsurance && (
                <div className="card">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Insurance Coverage</h3>
                  <div className="cd-grid cd-grid-2 gap-6">
                    {profile.insuranceProvider && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Provider</label>
                        <p className="text-gray-900">{profile.insuranceProvider}</p>
                      </div>
                    )}
                    {profile.liabilityCoverage && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Liability Coverage</label>
                        <p className="text-gray-900">{formatCurrency(profile.liabilityCoverage * 100)}</p>
                      </div>
                    )}
                    {profile.insuranceExpiryDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                        <p className="text-gray-900">{formatDate(profile.insuranceExpiryDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Actions */}
              <div className="text-center">
                <Link href="/dashboard" className="btn-primary mr-4">
                  View Dashboard
                </Link>
                <Link href="/upload" className="btn-secondary">
                  Upload Images
                </Link>
              </div>
            </div>
          ) : (
            <div className="card text-center">
              <p className="text-gray-600">Loading profile information...</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Profile;