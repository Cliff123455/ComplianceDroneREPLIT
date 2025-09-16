// React authentication hook for ComplianceDrone
// Based on Replit Auth integration

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  pilotProfile?: {
    id: string;
    status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended';
    companyName?: string;
    phoneNumber?: string;
    part107Certified: boolean;
    completedJobs: number;
    averageRating?: number;
  };
}

// Custom fetch function with error handling
const fetchUser = async (): Promise<AuthUser | null> => {
  const response = await fetch('/api/auth/user');
  
  if (response.status === 401) {
    return null; // User not authenticated
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }
  
  return response.json();
};

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = () => {
    // Clear the user query cache
    queryClient.setQueryData(["/api/auth/user"], null);
    // Redirect to logout endpoint
    window.location.href = "/api/logout";
  };

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPilot: !!user?.pilotProfile,
    pilotStatus: user?.pilotProfile?.status || null,
    login,
    logout,
    refreshUser,
    error
  };
}