/**
 * Create Neon Database
 * 
 * Creates a new PostgreSQL database in Neon for a city.
 * Returns the connection string for the new database.
 * 
 * Note: Neon databases are created within a Neon project.
 * Each city gets its own database (not a separate project).
 */

import { Pool } from 'pg';
import { getNeonAdminPool, withConnection } from '../utils/connections';
import { logger } from '../utils/logger';

/**
 * Options for database creation
 */
export interface CreateDatabaseOptions {
  citySlug: string;
  databaseName?: string; // Defaults to citySlug with underscores
  owner?: string; // Database owner role
}

/**
 * Result of database creation
 */
export interface CreateDatabaseResult {
  databaseName: string;
  connectionString: string;
  alreadyExisted: boolean;
}

/**
 * Create a new database in Neon
 * 
 * @returns Connection string for the new database
 */
export async function createNeonDatabase(
  options: CreateDatabaseOptions
): Promise<CreateDatabaseResult> {
  const { citySlug, databaseName: customName, owner = 'neondb_owner' } = options;

  // Generate database name from city slug (replace dashes with underscores)
  const databaseName = customName || `conecta_${citySlug.replace(/-/g, '_')}`;

  logger.info({ citySlug }, `Creating Neon database: ${databaseName}`);

  const adminPool = getNeonAdminPool();

  // Check if database already exists
  const exists = await databaseExists(adminPool, databaseName);

  if (exists) {
    logger.warn({ citySlug }, `Database "${databaseName}" already exists, skipping creation`);
    
    // Build connection string for existing database
    const connectionString = buildConnectionString(databaseName);
    
    return {
      databaseName,
      connectionString,
      alreadyExisted: true,
    };
  }

  // Create database
  await withConnection(adminPool, async (client) => {
    // Note: CREATE DATABASE cannot run inside a transaction
    await client.query(`CREATE DATABASE "${databaseName}" OWNER "${owner}"`);
  });

  logger.databaseCreated(citySlug, databaseName);

  // Build connection string for new database
  const connectionString = buildConnectionString(databaseName);

  return {
    databaseName,
    connectionString,
    alreadyExisted: false,
  };
}

/**
 * Check if database exists
 */
async function databaseExists(pool: Pool, databaseName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [databaseName]
  );
  return result.rows.length > 0;
}

/**
 * Build connection string for a Neon database
 * 
 * Takes NEON_ADMIN_URL and replaces the database name
 * Example: postgresql://user:pass@host/admin -> postgresql://user:pass@host/city_db
 */
function buildConnectionString(databaseName: string): string {
  const adminUrl = process.env.NEON_ADMIN_URL;
  if (!adminUrl) {
    throw new Error('NEON_ADMIN_URL environment variable not set');
  }

  // Parse the admin URL
  const url = new URL(adminUrl);
  
  // Replace database name
  url.pathname = `/${databaseName}`;

  return url.toString();
}

/**
 * Drop database (DANGEROUS - use with caution)
 */
export async function dropNeonDatabase(
  citySlug: string,
  databaseName?: string
): Promise<void> {
  const dbName = databaseName || `conecta_${citySlug.replace(/-/g, '_')}`;

  logger.warn({ citySlug }, `⚠️  DROPPING database: ${dbName}`);

  const adminPool = getNeonAdminPool();

  await withConnection(adminPool, async (client) => {
    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName]);

    // Drop database
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  });

  logger.success({ citySlug }, `Database "${dbName}" dropped`);
}
