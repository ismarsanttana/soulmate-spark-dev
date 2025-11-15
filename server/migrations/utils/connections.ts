/**
 * Database Connection Management
 * 
 * Manages PostgreSQL connection pools for:
 * - Supabase (Control Plane + current data)
 * - Neon Admin (for creating databases)
 * - Neon per-city databases (Data Plane)
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from './logger';

/**
 * Environment variable keys
 */
const ENV = {
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  CONTROL_DB_URL: process.env.CONTROL_DB_URL || process.env.SUPABASE_DB_URL,
  NEON_ADMIN_URL: process.env.NEON_ADMIN_URL,
  NEON_PROJECT_ID: process.env.NEON_PROJECT_ID,
} as const;

/**
 * Pool cache to reuse connections
 */
const poolCache = new Map<string, Pool>();

/**
 * Default pool configuration
 */
const DEFAULT_POOL_CONFIG: PoolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

/**
 * Create or get cached pool
 */
function getOrCreatePool(connectionString: string, label: string): Pool {
  if (!connectionString) {
    throw new Error(`Connection string not provided for: ${label}`);
  }

  if (poolCache.has(connectionString)) {
    return poolCache.get(connectionString)!;
  }

  const pool = new Pool({
    ...DEFAULT_POOL_CONFIG,
    connectionString,
  });

  pool.on('error', (err) => {
    logger.error({ }, `Unexpected error on ${label} pool`, err);
  });

  poolCache.set(connectionString, pool);
  return pool;
}

/**
 * Get Supabase connection pool (Control Plane + current data)
 * This is the source of truth for Afogados data today
 */
export function getSupabasePool(): Pool {
  if (!ENV.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL environment variable not set');
  }
  return getOrCreatePool(ENV.SUPABASE_DB_URL, 'Supabase');
}

/**
 * Get Control Plane connection pool
 * Used for cities table and global platform data
 * 
 * Can be same as Supabase for now, but allows future separation
 */
export function getControlPlanePool(): Pool {
  if (!ENV.CONTROL_DB_URL) {
    throw new Error('CONTROL_DB_URL environment variable not set');
  }
  return getOrCreatePool(ENV.CONTROL_DB_URL, 'Control Plane');
}

/**
 * Get Neon Admin connection pool
 * Used to CREATE DATABASE and manage Neon project
 */
export function getNeonAdminPool(): Pool {
  if (!ENV.NEON_ADMIN_URL) {
    throw new Error('NEON_ADMIN_URL environment variable not set');
  }
  return getOrCreatePool(ENV.NEON_ADMIN_URL, 'Neon Admin');
}

/**
 * Get city-specific Neon database pool
 * 
 * @param citySlug - City slug (e.g., 'afogados-da-ingazeira')
 * @param dbUrl - Optional direct DB URL. If not provided, fetches from cities table
 */
export async function getCityNeonPool(citySlug: string, dbUrl?: string): Promise<Pool> {
  let connectionString = dbUrl;

  // If URL not provided, fetch from cities table
  if (!connectionString) {
    const city = await getCityFromControlPlane(citySlug);
    if (!city || !city.db_url) {
      throw new Error(`City "${citySlug}" not found or db_url not set in cities table`);
    }
    connectionString = city.db_url;
  }

  return getOrCreatePool(connectionString, `Neon City: ${citySlug}`);
}

/**
 * City data from Control Plane
 */
export interface City {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  db_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get city configuration from Control Plane
 */
export async function getCityFromControlPlane(citySlug: string): Promise<City | null> {
  const pool = getControlPlanePool();
  
  const result = await pool.query<City>(
    `SELECT 
      id, name, slug, logo_url,
      primary_color, secondary_color, accent_color,
      db_url, is_active, created_at, updated_at
    FROM public.cities
    WHERE slug = $1`,
    [citySlug]
  );

  return result.rows[0] || null;
}

/**
 * Update city db_url in Control Plane
 */
export async function updateCityDbUrl(citySlug: string, dbUrl: string): Promise<void> {
  const pool = getControlPlanePool();
  
  await pool.query(
    `UPDATE public.cities
    SET db_url = $1, updated_at = NOW()
    WHERE slug = $2`,
    [dbUrl, citySlug]
  );

  logger.success({ citySlug }, `Updated db_url in cities table`);
}

/**
 * Execute query with automatic connection handling
 */
export async function withConnection<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

/**
 * Execute query in transaction
 */
export async function withTransaction<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all pooled connections
 * Call this when shutting down the application
 */
export async function closeAllPools(): Promise<void> {
  const pools = Array.from(poolCache.values());
  await Promise.all(pools.map(pool => pool.end()));
  poolCache.clear();
  logger.info({}, 'All database pools closed');
}

/**
 * Test database connection
 */
export async function testConnection(pool: Pool, label: string): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW() as now');
    logger.success({}, `${label} connection successful`, { serverTime: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error({}, `${label} connection failed`, error);
    return false;
  }
}
