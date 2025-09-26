"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ComplianceStatus = "Compliant" | "Warning" | "Non-compliant";

export interface ComplianceRecord {
  plantCode: string;
  plantName: string;
  state: string;
  complianceStatus: ComplianceStatus;
  lastInspection: string;
  nextInspection: string;
  issues: number;
}

interface ComplianceApiResponse {
  success: boolean;
  data: ComplianceRecord[];
  error?: string;
}

interface ComplianceStats {
  total: number;
  complianceRate: number;
  totals: {
    compliant: number;
    warning: number;
    nonCompliant: number;
  };
}

export interface UseComplianceDataResult {
  records: ComplianceRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  stats: ComplianceStats;
  refresh: () => Promise<boolean>;
}

const COMPLIANCE_ENDPOINT = "/api/eia/compliance";

async function fetchComplianceRecords(signal?: AbortSignal): Promise<ComplianceRecord[]> {
  const response = await fetch(COMPLIANCE_ENDPOINT, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ComplianceApiResponse;

  if (!payload.success) {
    throw new Error(payload.error ?? "Failed to load compliance records.");
  }

  return payload.data;
}

export function useComplianceData(initialRecords?: ComplianceRecord[]): UseComplianceDataResult {
  const hasInitialData = Array.isArray(initialRecords) && initialRecords.length > 0;

  const [records, setRecords] = useState<ComplianceRecord[]>(initialRecords ?? []);
  const [loading, setLoading] = useState<boolean>(!hasInitialData);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompliance = useCallback(
    async (signal?: AbortSignal) => {
      const data = await fetchComplianceRecords(signal);
      setRecords(data);
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      if (hasInitialData) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        await loadCompliance(controller.signal);
      } catch (err) {
        if (active && !(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Failed to load compliance data", err);
          setError("Could not load compliance records.");
        }
      } finally {
        if (!active) {
          return;
        }
        if (hasInitialData) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [hasInitialData, loadCompliance]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadCompliance();
      return true;
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error("Failed to refresh compliance data", err);
        setError("Could not load compliance records.");
      }
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [loadCompliance]);

  const stats = useMemo<ComplianceStats>(() => {
    const totals = records.reduce(
      (acc, record) => {
        if (record.complianceStatus === "Compliant") {
          acc.compliant += 1;
        } else if (record.complianceStatus === "Warning") {
          acc.warning += 1;
        } else {
          acc.nonCompliant += 1;
        }
        return acc;
      },
      { compliant: 0, warning: 0, nonCompliant: 0 }
    );

    const total = records.length;
    const complianceRate = total ? (totals.compliant / total) * 100 : 0;

    return {
      total,
      complianceRate,
      totals,
    };
  }, [records]);

  return {
    records,
    loading,
    refreshing,
    error,
    stats,
    refresh,
  };
}
