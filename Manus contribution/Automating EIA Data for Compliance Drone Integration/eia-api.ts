/**
 * EIA API Integration Library
 * Handles all interactions with the U.S. Energy Information Administration API
 */

const EIA_API_KEY = process.env.EIA_API_KEY || 'GyugVRs959vfohm52ctv60qhTNKEzTAjWLhLGxlq';
const EIA_BASE_URL = process.env.EIA_API_BASE_URL || 'https://api.eia.gov/v2';

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
    params: Record<string, any>;
  };
}

/**
 * Base API request function
 */
async function makeEIARequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<EIAApiResponse<T>> {
  const url = new URL(`${EIA_BASE_URL}${endpoint}`);
  
  // Add API key and default parameters
  url.searchParams.append('api_key', EIA_API_KEY);
  
  // Add custom parameters
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v.toString()));
    } else {
      url.searchParams.append(key, value.toString());
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`EIA API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`EIA API Error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error('EIA API Request failed:', error);
    throw error;
  }
}

/**
 * Get solar plants data
 */
export async function getSolarPlants(state?: string, limit: number = 100): Promise<EIAPlant[]> {
  const params: Record<string, any> = {
    'frequency': 'annual',
    'data[0]': 'nameplate-capacity',
    'facets[primeMover][]': 'PV', // Photovoltaic
    'start': '2020',
    'end': '2024',
    'sort[0][column]': 'nameplate-capacity',
    'sort[0][direction]': 'desc',
    'length': limit
  };

  if (state) {
    params['facets[state][]'] = state;
  }

  try {
    const response = await makeEIARequest<any>('/electricity/facility-fuel/data', params);
    
    return response.response.data.map((item: any) => ({
      plantCode: item.plantCode || '',
      plantName: item.plantName || '',
      state: item.state || '',
      primeMover: item.primeMover || '',
      fuel2002: item.fuel2002 || '',
      capacity: parseFloat(item['nameplate-capacity']) || 0,
      operatingYear: parseInt(item.period) || 0
    }));
  } catch (error) {
    console.error('Failed to fetch solar plants:', error);
    return [];
  }
}

/**
 * Get electricity generation data by state
 */
export async function getStateElectricityData(states: string[] = ['CA', 'TX', 'FL', 'NY'], years: number = 3): Promise<EIAStateData[]> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years;
  
  const params = {
    'frequency': 'annual',
    'data[0]': 'sales',
    'facets[stateid][]': states,
    'start': startYear.toString(),
    'end': currentYear.toString(),
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc'
  };

  try {
    const response = await makeEIARequest<any>('/electricity/retail-sales/data', params);
    
    return response.response.data.map((item: any) => ({
      period: item.period,
      stateid: item.stateid,
      stateDescription: item.stateDescription,
      sales: parseFloat(item.sales) || 0,
      salesUnits: item['sales-units'] || 'million kilowatt hours'
    }));
  } catch (error) {
    console.error('Failed to fetch state electricity data:', error);
    return [];
  }
}

/**
 * Get renewable energy generation data
 */
export async function getRenewableGenerationData(state?: string): Promise<any[]> {
  const params: Record<string, any> = {
    'frequency': 'monthly',
    'data[0]': 'generation',
    'facets[fueltypeid][]': ['SUN', 'WND'], // Solar and Wind
    'start': '2023-01',
    'end': '2024-12',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    'length': 100
  };

  if (state) {
    params['facets[location][]'] = state;
  }

  try {
    const response = await makeEIARequest<any>('/electricity/electric-power-operational-data/data', params);
    return response.response.data || [];
  } catch (error) {
    console.error('Failed to fetch renewable generation data:', error);
    return [];
  }
}

/**
 * Search for plants by name or location
 */
export async function searchPlants(query: string, limit: number = 50): Promise<EIAPlant[]> {
  // This is a simplified search - in a real implementation, you might need to
  // fetch all plants and filter client-side, or use a different endpoint
  try {
    const allPlants = await getSolarPlants(undefined, 500);
    
    const filteredPlants = allPlants.filter(plant => 
      plant.plantName.toLowerCase().includes(query.toLowerCase()) ||
      plant.state.toLowerCase().includes(query.toLowerCase())
    );

    return filteredPlants.slice(0, limit);
  } catch (error) {
    console.error('Failed to search plants:', error);
    return [];
  }
}

/**
 * Get plant details by plant code
 */
export async function getPlantDetails(plantCode: string): Promise<EIAPlant | null> {
  const params = {
    'frequency': 'annual',
    'data[0]': 'nameplate-capacity',
    'facets[plantCode][]': plantCode,
    'start': '2020',
    'end': '2024'
  };

  try {
    const response = await makeEIARequest<any>('/electricity/facility-fuel/data', params);
    
    if (response.response.data.length === 0) {
      return null;
    }

    const item = response.response.data[0];
    return {
      plantCode: item.plantCode || '',
      plantName: item.plantName || '',
      state: item.state || '',
      primeMover: item.primeMover || '',
      fuel2002: item.fuel2002 || '',
      capacity: parseFloat(item['nameplate-capacity']) || 0,
      operatingYear: parseInt(item.period) || 0
    };
  } catch (error) {
    console.error('Failed to fetch plant details:', error);
    return null;
  }
}

/**
 * Get compliance and regulatory data
 */
export async function getComplianceData(): Promise<any[]> {
  // This would fetch regulatory compliance data
  // For now, return mock data structure
  return [
    {
      plantCode: 'SAMPLE001',
      plantName: 'Sample Solar Plant',
      complianceStatus: 'Compliant',
      lastInspection: '2024-01-15',
      nextInspection: '2024-07-15',
      issues: []
    }
  ];
}

/**
 * Utility function to format capacity values
 */
export function formatCapacity(capacity: number): string {
  if (capacity >= 1000) {
    return `${(capacity / 1000).toFixed(1)} GW`;
  }
  return `${capacity.toFixed(1)} MW`;
}

/**
 * Utility function to get state abbreviation from full name
 */
export function getStateAbbreviation(stateName: string): string {
  const stateMap: Record<string, string> = {
    'California': 'CA',
    'Texas': 'TX',
    'Florida': 'FL',
    'New York': 'NY',
    'North Carolina': 'NC',
    // Add more states as needed
  };
  
  return stateMap[stateName] || stateName;
}

