import "server-only";

/**
 * EIA API integration helpers.
 * All requests run on the server to keep the API key out of client bundles.
 */

const EIA_BASE_URL = process.env.EIA_API_BASE_URL || "https://api.eia.gov/v2";

function getEIAApiKey(): string {
  const key = process.env.EIA_API_KEY;
  if (!key) {
    throw new Error("EIA_API_KEY is not set. Please configure it in your environment.");
  }
  return key;
}

export interface EIAPlant {
  plantCode: string;
  plantName: string;
  state: string;
  primeMover: string;
  fuel2002: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  operatingYear?: number;
  status?: string;
  latestGeneration?: number;
  generationUnits?: string;
}

export interface EIAGenerationData {
  period: string;
  plantCode: string;
  generation: number;
  generationUnits: string;
}

export interface EIAStateData {
  period: string;
  stateid: string;
  stateDescription: string;
  sales: number;
  salesUnits: string;
}

export interface EIAApiResponse<T> {
  response: {
    data: T[];
    total: number;
  };
  request: {
    command: string;
    params: Record<string, unknown>;
  };
}

async function makeEIARequest<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<EIAApiResponse<T>> {
  const url = new URL(`${EIA_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", getEIAApiKey());

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
    } else if (typeof value !== "undefined" && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`EIA API Error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as EIAApiResponse<T> & { error?: string };
  if (data.error) {
    throw new Error(`EIA API Error: ${data.error}`);
  }

  return data;
}

export async function getSolarPlantSummary(state?: string) {
  const params: Record<string, unknown> = {
    frequency: "annual",
    "data[0]": "generation",
    "facets[primeMover][]": "PV",
    start: "2023",
    end: "2024",
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: 1,
  };

  if (state) {
    params["facets[state][]"] = state;
  }

  try {
    const response = await makeEIARequest<any>("/electricity/facility-fuel/data", params);
    const top = response.response.data.at(0);

    return {
      total: response.response.total,
      topPlant: top?.plantName as string | undefined,
      topGenerationMWh: top ? Number.parseFloat(top.generation ?? "0") || 0 : 0,
      generationUnit: (top?.["generation-units"] as string | undefined) ?? "megawatthours",
    };
  } catch (error) {
    console.error("EIA solar plant summary error", error);
    return {
      total: 0,
      topPlant: undefined,
      topGenerationMWh: 0,
      generationUnit: "megawatthours",
    };
  }
}

export async function getSolarPlants(state?: string, limit = 100): Promise<EIAPlant[]> {
  const params: Record<string, unknown> = {
    frequency: "annual",
    "data[0]": "generation",
    "facets[primeMover][]": "PV",
    start: "2023",
    end: "2024",
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: Math.max(limit * 2, 50),
  };

  if (state) {
    params["facets[state][]"] = state;
  }

  try {
    const response = await makeEIARequest<any>("/electricity/facility-fuel/data", params);
    const seen = new Set<string>();
    const plants: EIAPlant[] = [];

    for (const item of response.response.data ?? []) {
      const plantCode = String(item.plantCode ?? "");
      if (!plantCode || seen.has(plantCode)) {
        continue;
      }
      seen.add(plantCode);

      plants.push({
        plantCode,
        plantName: item.plantName || "",
        state: item.state || "",
        primeMover: item.primeMover || "",
        fuel2002: item.fuel2002 || "",
        operatingYear: item.period ? Number.parseInt(String(item.period), 10) || undefined : undefined,
        latestGeneration: item.generation ? Number.parseFloat(String(item.generation)) || undefined : undefined,
        generationUnits: item["generation-units"] || "megawatthours",
      });

      if (plants.length >= limit) {
        break;
      }
    }

    return plants;
  } catch (error) {
    console.error("Failed to fetch solar plants", error);
    return [];
  }
}

export async function getStateElectricityData(states: string[] = ["CA", "TX", "FL", "NY"], years = 3): Promise<EIAStateData[]> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years;

  const params: Record<string, unknown> = {
    frequency: "annual",
    "data[0]": "sales",
    "facets[stateid][]": states,
    start: String(startYear),
    end: String(currentYear),
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
  };

  const response = await makeEIARequest<any>("/electricity/retail-sales/data", params);

  return response.response.data.map((item) => ({
    period: item.period,
    stateid: item.stateid,
    stateDescription: item.stateDescription,
    sales: Number.parseFloat(item.sales) || 0,
    salesUnits: item["sales-units"] || "million kilowatt hours",
  }));
}

export async function getRenewableGenerationData(state?: string, start = "2023-01", end = "2024-12", limit = 100) {
  const params: Record<string, unknown> = {
    frequency: "monthly",
    "data[0]": "generation",
    "facets[fueltypeid][]": ["SUN", "WND"],
    start,
    end,
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: limit,
  };

  if (state) {
    params["facets[location][]"] = state;
  }

  const response = await makeEIARequest<any>("/electricity/electric-power-operational-data/data", params);
  return response.response.data || [];
}

export async function searchPlants(query: string, limit = 50): Promise<EIAPlant[]> {
  const allPlants = await getSolarPlants(undefined, 500);
  const filtered = allPlants.filter((plant) => {
    const haystack = `${plant.plantName} ${plant.state}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return filtered.slice(0, limit);
}

export async function getPlantDetails(plantCode: string): Promise<EIAPlant | null> {
  const params: Record<string, unknown> = {
    frequency: "annual",
    "data[0]": "generation",
    "facets[plantCode][]": plantCode,
    start: "2023",
    end: "2024",
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: 1,
  };

  try {
    const response = await makeEIARequest<any>("/electricity/facility-fuel/data", params);
    const record = response.response.data.at(0);

    if (!record) {
      return null;
    }

    return {
      plantCode: record.plantCode || "",
      plantName: record.plantName || "",
      state: record.state || "",
      primeMover: record.primeMover || "",
      fuel2002: record.fuel2002 || "",
      operatingYear: record.period ? Number.parseInt(String(record.period), 10) || undefined : undefined,
      latestGeneration: record.generation ? Number.parseFloat(String(record.generation)) || undefined : undefined,
      generationUnits: record["generation-units"] || "megawatthours",
    };
  } catch (error) {
    console.error(`Failed to fetch plant details for ${plantCode}`, error);
    return null;
  }
}

export function formatCapacity(capacity: number): string {
  if (capacity >= 1000) {
    return `${(capacity / 1000).toFixed(1)} GW`;
  }
  return `${capacity.toFixed(1)} MW`;
}

export function getStateAbbreviation(stateName: string): string {
  const map: Record<string, string> = {
    California: "CA",
    Texas: "TX",
    Florida: "FL",
    "New York": "NY",
    "North Carolina": "NC",
  };

  return map[stateName] || stateName;
}

const HOURS_PER_MONTH = 730;

type RawOperationalRecord = Record<string, unknown>;

interface NormalizedOperationalRecord {
  period: string;
  date: Date;
  generation: number;
}

interface ComplianceRecordResult {
  plantCode: string;
  plantName: string;
  state: string;
  complianceStatus: "Compliant" | "Warning" | "Non-compliant";
  lastInspection: string;
  nextInspection: string;
  issues: number;
  notes?: string[];
  metrics?: {
    latestPeriod: string;
    latestGenerationMWh: number;
    recentAverageMWh: number;
    previousAverageMWh: number;
    capacityMW?: number;
    capacityFactorPercent?: number;
  };
}

const FALLBACK_COMPLIANCE_DATA: ComplianceRecordResult[] = [
  {
    plantCode: "SAMPLE001",
    plantName: "Desert Sunlight Solar Farm",
    state: "CA",
    complianceStatus: "Compliant",
    lastInspection: "2024-08-15",
    nextInspection: "2025-02-15",
    issues: 0,
  },
  {
    plantCode: "SAMPLE002",
    plantName: "Copper Mountain Solar",
    state: "NV",
    complianceStatus: "Warning",
    lastInspection: "2024-07-01",
    nextInspection: "2024-10-01",
    issues: 2,
  },
  {
    plantCode: "SAMPLE003",
    plantName: "Topaz Solar Farm",
    state: "CA",
    complianceStatus: "Non-compliant",
    lastInspection: "2024-06-10",
    nextInspection: "2024-09-10",
    issues: 4,
  },
];

function parsePeriodToDate(period?: string): Date | null {
  if (!period) {
    return null;
  }
  const trimmed = period.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [yearPart, monthPart] = trimmed.split("-");
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    if (Number.isNaN(year) || Number.isNaN(month)) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, 1));
  }
  if (/^\d{6}$/.test(trimmed)) {
    const year = Number.parseInt(trimmed.slice(0, 4), 10);
    const month = Number.parseInt(trimmed.slice(4, 6), 10);
    if (Number.isNaN(year) || Number.isNaN(month)) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, 1));
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
}

function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatPeriod(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function addMonthsUtc(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return 0;
    }
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractGeneration(record: RawOperationalRecord): number {
  const candidateKeys = [
    "generation",
    "value",
    "netgeneration",
    "net-generation",
    "generation-mwh",
    "operatinggeneration",
    "net_generation",
  ];
  for (const key of candidateKeys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const candidate = toNumber((record as Record<string, unknown>)[key]);
      return candidate;
    }
  }
  for (const value of Object.values(record)) {
    const numeric = toNumber(value);
    if (numeric !== 0) {
      return numeric;
    }
  }
  return 0;
}

function evaluatePlantCompliance(plant: EIAPlant, rawRecords: RawOperationalRecord[], now: Date): ComplianceRecordResult {
  const notes: string[] = [];
  let severity = 0;

  const normalized = (rawRecords ?? [])
    .map((entry) => {
      const record = entry as Record<string, unknown>;
      const periodValue =
        typeof record.period === "string"
          ? record.period
          : typeof record.periodid === "string"
          ? record.periodid
          : typeof record["period_id"] === "string"
          ? (record["period_id"] as string)
          : undefined;
      const date = parsePeriodToDate(periodValue);
      if (!date) {
        return null;
      }
      return {
        period: formatPeriod(date),
        date,
        generation: extractGeneration(record),
      };
    })
    .filter((value): value is NormalizedOperationalRecord => value !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const firstRecord = rawRecords?.[0] as Record<string, unknown> | undefined;
  const derivedState =
    typeof firstRecord?.["location"] === "string"
      ? (firstRecord["location"] as string)
      : typeof firstRecord?.["state"] === "string"
      ? (firstRecord["state"] as string)
      : typeof firstRecord?.["stateid"] === "string"
      ? (firstRecord["stateid"] as string)
      : "";
  const state = plant.state || derivedState;

  if (!normalized.length) {
    const fallbackLastInspection = addMonthsUtc(now, -6);
    const note = "No generation data available from EIA for the past year.";
    return {
      plantCode: plant.plantCode,
      plantName: plant.plantName,
      state,
      complianceStatus: "Non-compliant",
      lastInspection: formatDateISO(fallbackLastInspection),
      nextInspection: formatDateISO(addDaysUtc(now, 14)),
      issues: 1,
      notes: [note],
      metrics: {
        latestPeriod: formatPeriod(fallbackLastInspection),
        latestGenerationMWh: 0,
        recentAverageMWh: 0,
        previousAverageMWh: 0,
        capacityMW: plant.capacity,
      },
    };
  }

  const latest = normalized[0];
  const recent = normalized.slice(0, 3);
  const previous = normalized.slice(3, 6);

  const average = (items: NormalizedOperationalRecord[]): number => {
    if (!items.length) {
      return 0;
    }
    const total = items.reduce((sum, item) => sum + item.generation, 0);
    return total / items.length;
  };

  const recentAverage = average(recent);
  const previousAverage = average(previous);
  const monthsSinceLatest = monthsBetween(latest.date, now);

  const raise = (level: number, message: string) => {
    if (severity < level) {
      severity = level;
    }
    if (!notes.includes(message)) {
      notes.push(message);
    }
  };

  if (monthsSinceLatest > 6) {
    raise(2, "No recent generation data in over six months.");
  } else if (monthsSinceLatest > 3) {
    raise(1, "Generation data older than three months.");
  }

  if (recent.length >= 3 && recent.every((item) => item.generation <= 0)) {
    raise(2, "Zero reported generation for three consecutive months.");
  } else if (recentAverage <= 0) {
    raise(2, "No recent generation reported.");
  }

  if (previousAverage > 0 && recentAverage < previousAverage * 0.2) {
    raise(2, "Generation dropped more than 80% compared to the prior quarter.");
  } else if (previousAverage > 0 && recentAverage < previousAverage * 0.4) {
    raise(1, "Generation dropped more than 60% compared to the prior quarter.");
  }

  const capacity = typeof plant.capacity === "number" && Number.isFinite(plant.capacity) ? plant.capacity : 0;
  let capacityFactorPercent: number | undefined;
  if (capacity > 0 && recentAverage > 0) {
    const expectedMonthlyMWh = capacity * HOURS_PER_MONTH;
    if (expectedMonthlyMWh > 0) {
      const factor = (recentAverage / expectedMonthlyMWh) * 100;
      capacityFactorPercent = Number(factor.toFixed(1));
      if (factor < 3) {
        raise(2, "Capacity factor below 3% of nameplate rating.");
      } else if (factor < 10) {
        raise(1, "Capacity factor below 10% of nameplate rating.");
      }
    }
  }

  const complianceStatus: ComplianceRecordResult["complianceStatus"] =
    severity >= 2 ? "Non-compliant" : severity === 1 ? "Warning" : "Compliant";

  const nextBaseDate =
    severity >= 2 ? addDaysUtc(now, 14) : severity === 1 ? addMonthsUtc(latest.date, 1) : addMonthsUtc(latest.date, 3);

  const issues = notes.length || (severity > 0 ? 1 : 0);

  return {
    plantCode: plant.plantCode,
    plantName: plant.plantName,
    state,
    complianceStatus,
    lastInspection: formatDateISO(latest.date),
    nextInspection: formatDateISO(nextBaseDate),
    issues,
    notes: notes.length ? notes : undefined,
    metrics: {
      latestPeriod: latest.period,
      latestGenerationMWh: Number(latest.generation.toFixed(2)),
      recentAverageMWh: Number(recentAverage.toFixed(2)),
      previousAverageMWh: Number(previousAverage.toFixed(2)),
      capacityMW: capacity || undefined,
      capacityFactorPercent,
    },
  };
}

function complianceSeverityValue(status: ComplianceRecordResult["complianceStatus"]): number {
  switch (status) {
    case "Non-compliant":
      return 2;
    case "Warning":
      return 1;
    default:
      return 0;
  }
}

export async function getComplianceData(limit = 25): Promise<ComplianceRecordResult[]> {
  const apiKeyConfigured = typeof process.env.EIA_API_KEY === "string" && process.env.EIA_API_KEY.trim().length > 0;
  if (!apiKeyConfigured) {
    return FALLBACK_COMPLIANCE_DATA;
  }

  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.trunc(limit), 25) : 25;

  try {
    const plants = await getSolarPlants(undefined, safeLimit);
    if (!plants.length) {
      return FALLBACK_COMPLIANCE_DATA;
    }

    const plantMap = new Map<string, EIAPlant>();
    for (const plant of plants) {
      if (plant.plantCode) {
        plantMap.set(plant.plantCode, plant);
      }
    }

    if (!plantMap.size) {
      return FALLBACK_COMPLIANCE_DATA;
    }

    const now = new Date();
    const startPeriod = formatPeriod(addMonthsUtc(now, -12));
    const endPeriod = formatPeriod(addMonthsUtc(now, 0));
    const complianceRecords: ComplianceRecordResult[] = [];

    for (const [plantCode, plant] of Array.from(plantMap.entries()).slice(0, safeLimit)) {
      let rawRecords: RawOperationalRecord[] = [];
      try {
        const params: Record<string, unknown> = {
          frequency: "monthly",
          "data[0]": "generation",
          start: startPeriod,
          end: endPeriod,
          "sort[0][column]": "period",
          "sort[0][direction]": "desc",
          length: 12,
          "facets[fueltypeid][]": "SUN",
        };
        (params as Record<string, unknown>)["facets[plantcode][]"] = [plantCode];
        (params as Record<string, unknown>)["facets[plantCode][]"] = [plantCode];

        const response = await makeEIARequest<RawOperationalRecord>(
          "/electricity/electric-power-operational-data/data",
          params,
        );
        rawRecords = response.response?.data ?? [];
      } catch (error) {
        console.error(`EIA compliance fetch failed for plant ${plantCode}`, error);
      }

      const record = evaluatePlantCompliance(plant, rawRecords, now);
      complianceRecords.push(record);
    }

    complianceRecords.sort(
      (a, b) => complianceSeverityValue(b.complianceStatus) - complianceSeverityValue(a.complianceStatus),
    );

    return complianceRecords.length ? complianceRecords : FALLBACK_COMPLIANCE_DATA;
  } catch (error) {
    console.error("EIA compliance aggregation error", error);
    return FALLBACK_COMPLIANCE_DATA;
  }
}

