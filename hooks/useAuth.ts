// React authentication hook for ComplianceDrone using NextAuth

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  pilotProfile?: {
    id: string;
    status: "pending" | "approved" | "active" | "inactive" | "suspended";
    companyName?: string;
    phoneNumber?: string;
    part107Certified: boolean;
    completedJobs: number;
    averageRating?: number;
    totalEarnings?: number;
    thermalExperienceYears?: number | null;
    totalFlightHours?: number | null;
  };
}

const fetchUser = async (): Promise<AuthUser | null> => {
  const response = await fetch("/api/auth/user", { cache: "no-store" });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
};

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: fetchUser,
    enabled: status === "authenticated",
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      queryClient.setQueryData(["auth", "user"], null);
    }
  }, [status, queryClient]);

  const login = (provider?: string) => {
    signIn(provider);
  };

  const logout = () => {
    signOut({ callbackUrl: "/" });
    queryClient.setQueryData(["auth", "user"], null);
  };

  const refreshUser = () => {
    refetch();
  };

  return {
    user,
    session,
    isLoading: status === "loading" || isLoading,
    isAuthenticated: status === "authenticated",
    isPilot: !!user?.pilotProfile,
    pilotStatus: user?.pilotProfile?.status ?? null,
    login,
    logout,
    refreshUser,
    error,
  };
}
