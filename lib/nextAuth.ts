// Authentication utility for Next.js API routes
// Validates sessions against PostgreSQL session store

import { NextApiRequest } from 'next';
import { Pool } from 'pg';
import { parse } from 'cookie';

// Create a connection pool instead of per-request clients
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Parse session ID from signed cookie
function parseSessionId(cookieValue: string, secret: string): string | null {
  try {
    // Extract session ID from signed cookie format: s:sessionId.signature
    if (cookieValue.startsWith('s:')) {
      const unsigned = cookieValue.slice(2);
      const sessionId = unsigned.split('.')[0];
      return sessionId;
    }
    return cookieValue;
  } catch {
    return null;
  }
}

// Validate session against PostgreSQL session store
export async function hasValidSession(req: NextApiRequest): Promise<boolean> {
  let client;
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return false;
    
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies['connect.sid'];
    if (!sessionCookie) return false;
    
    // Parse session ID
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      console.error('SESSION_SECRET environment variable not set');
      return false;
    }
    
    const sessionId = parseSessionId(sessionCookie, sessionSecret);
    if (!sessionId) return false;
    
    // Get client from pool instead of creating new connection
    client = await pool.connect();
    
    const result = await client.query(
      'SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    const sessionData = result.rows[0].sess;
    
    // Check if session has user authentication
    if (!sessionData.passport || !sessionData.passport.user) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  } finally {
    // Release client back to pool
    if (client) {
      client.release();
    }
  }
}

// Graceful shutdown function to close the pool
export async function closeDbPool(): Promise<void> {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

// Synchronous fallback for backwards compatibility (not recommended)
export function hasValidSessionSync(req: NextApiRequest): boolean {
  console.warn('hasValidSessionSync is deprecated and insecure. Use hasValidSession() instead.');
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return false;
  
  const cookies = parse(cookieHeader);
  return !!cookies['connect.sid'];
}