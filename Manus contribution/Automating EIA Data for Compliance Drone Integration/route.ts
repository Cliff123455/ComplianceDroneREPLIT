import { NextRequest, NextResponse } from 'next/server';
import { getSolarPlants, searchPlants } from '@/lib/eia-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '100');

    let plants;

    if (query) {
      // Search for plants by name or location
      plants = await searchPlants(query, limit);
    } else {
      // Get solar plants, optionally filtered by state
      plants = await getSolarPlants(state || undefined, limit);
    }

    return NextResponse.json({
      success: true,
      data: plants,
      total: plants.length,
      filters: {
        state: state || 'all',
        query: query || null,
        limit
      }
    });

  } catch (error) {
    console.error('EIA Plants API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch plant data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { states, limit = 100 } = body;

    if (!Array.isArray(states)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        message: 'States must be an array'
      }, { status: 400 });
    }

    // Get plants for multiple states
    const allPlants = [];
    
    for (const state of states) {
      const plants = await getSolarPlants(state, limit);
      allPlants.push(...plants);
    }

    return NextResponse.json({
      success: true,
      data: allPlants,
      total: allPlants.length,
      states: states
    });

  } catch (error) {
    console.error('EIA Plants POST API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch plant data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

