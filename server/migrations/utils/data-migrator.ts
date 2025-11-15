/**
 * Data Migrator
 * 
 * Copies data from Supabase tables to Neon city databases.
 * 
 * Features:
 * - Batch copying for efficiency
 * - city_id filtering for multi-tenant tables
 * - Idempotency checking (skip if data already exists)
 * - Progress tracking and logging
 * - Handles complex types (JSONB, arrays, timestamps)
 */

import { Pool, PoolClient } from 'pg';
import { logger } from './logger';
import { getTableRowCount, tableExists } from './schema-reader';

/**
 * Migration options
 */
export interface MigrationOptions {
  tableName: string;
  citySlug?: string;
  cityIdFilter?: string | null; // Filter value for city_id column (null = Afogados data without city_id)
  batchSize?: number;
  skipIfNotEmpty?: boolean; // Skip migration if target table already has rows
  truncateBeforeInsert?: boolean; // TRUNCATE table before inserting (for safe re-runs)
  schemaName?: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  tableName: string;
  rowsMigrated: number;
  skipped: boolean;
  skipReason?: string;
  duration: number; // milliseconds
}

/**
 * Check if table has city_id column
 */
async function hasCityIdColumn(pool: Pool, tableName: string, schemaName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
        AND column_name = 'city_id'
    ) as has_city_id
  `;

  const result = await pool.query(query, [schemaName, tableName]);
  return result.rows[0].has_city_id;
}

/**
 * Migrate data from Supabase to Neon
 */
export async function migrateTableData(
  sourcePool: Pool,
  targetPool: Pool,
  options: MigrationOptions
): Promise<MigrationResult> {
  const startTime = Date.now();
  const {
    tableName,
    citySlug,
    cityIdFilter = null,
    batchSize = 1000,
    skipIfNotEmpty = true,
    truncateBeforeInsert = false,
    schemaName = 'public',
  } = options;

  logger.info({ citySlug, tableName }, 'Starting data migration...');

  // Check if table exists in target
  const targetExists = await tableExists(targetPool, tableName, schemaName);
  if (!targetExists) {
    const duration = Date.now() - startTime;
    logger.warn({ citySlug, tableName }, 'Table does not exist in target database');
    return {
      tableName,
      rowsMigrated: 0,
      skipped: true,
      skipReason: 'Table does not exist in target',
      duration,
    };
  }

  // Check if target table is empty (idempotency)
  if (skipIfNotEmpty && !truncateBeforeInsert) {
    const targetRowCount = await getTableRowCount(targetPool, tableName, schemaName);
    if (targetRowCount > 0) {
      const duration = Date.now() - startTime;
      logger.skipped({ citySlug, tableName }, `Target already has ${targetRowCount} rows`);
      return {
        tableName,
        rowsMigrated: 0,
        skipped: true,
        skipReason: `Target already has ${targetRowCount} rows`,
        duration,
      };
    }
  }

  // Check if source table has city_id column
  const sourceHasCityId = await hasCityIdColumn(sourcePool, tableName, schemaName);

  // Build SELECT query
  let selectQuery = `SELECT * FROM "${schemaName}"."${tableName}"`;
  const queryParams: any[] = [];

  if (sourceHasCityId && cityIdFilter !== undefined) {
    if (cityIdFilter === null) {
      // Filter for rows WITHOUT city_id (legacy Afogados data)
      selectQuery += ` WHERE city_id IS NULL`;
    } else {
      // Filter for specific city_id
      selectQuery += ` WHERE city_id = $1`;
      queryParams.push(cityIdFilter);
    }
  }

  selectQuery += ` ORDER BY 1`; // Order by first column (usually id)

  // Get column names from target table
  const columnsResult = await targetPool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schemaName, tableName]
  );

  const targetColumns = columnsResult.rows.map((r) => r.column_name);

  if (targetColumns.length === 0) {
    const duration = Date.now() - startTime;
    logger.error({ citySlug, tableName }, 'No columns found in target table');
    return {
      tableName,
      rowsMigrated: 0,
      skipped: true,
      skipReason: 'No columns in target table',
      duration,
    };
  }

  // IMPORTANT: Wrap TRUNCATE + migration in a transaction for rollback safety
  const client = await targetPool.connect();
  let totalRowsMigrated = 0;
  
  try {
    await client.query('BEGIN');

    // TRUNCATE table if requested (for safe re-runs after partial failures)
    if (truncateBeforeInsert) {
      logger.info({ citySlug, tableName }, 'Truncating target table for clean re-run...');
      await client.query(`TRUNCATE TABLE "${schemaName}"."${tableName}" CASCADE`);
    }

    // Migrate data in batches
    let offset = 0;

    while (true) {
      const batchQuery = `${selectQuery} LIMIT ${batchSize} OFFSET ${offset}`;
      const batchResult = await sourcePool.query(batchQuery, queryParams);

      if (batchResult.rows.length === 0) {
        break; // No more rows to migrate
      }

      // Insert batch into target using the transaction client
      if (batchResult.rows.length > 0) {
        await insertBatchInTransaction(client, tableName, schemaName, targetColumns, batchResult.rows);
        totalRowsMigrated += batchResult.rows.length;

        logger.info(
          { citySlug, tableName },
          `Migrated batch: ${totalRowsMigrated} rows (${batchResult.rows.length} in this batch)`
        );
      }

      offset += batchSize;

      // Safety check: prevent infinite loop
      if (offset > 1_000_000) {
        logger.warn({ citySlug, tableName }, 'Reached safety limit of 1M rows');
        break;
      }
    }

    // Commit transaction
    await client.query('COMMIT');
  } catch (error) {
    // Rollback on error - undoes TRUNCATE and any partial inserts
    await client.query('ROLLBACK');
    logger.error({ citySlug, tableName }, `Migration failed, rolled back: ${error}`);
    throw error;
  } finally {
    client.release();
  }

  const duration = Date.now() - startTime;
  logger.dataMigration(citySlug || 'unknown', 'data', tableName, totalRowsMigrated);

  return {
    tableName,
    rowsMigrated: totalRowsMigrated,
    skipped: false,
    duration,
  };
}

/**
 * Insert batch of rows into target table using a transaction client
 * Uses ON CONFLICT DO NOTHING for safety (idempotent inserts)
 */
async function insertBatchInTransaction(
  client: PoolClient,
  tableName: string,
  schemaName: string,
  columns: string[],
  rows: any[]
): Promise<void> {
  if (rows.length === 0) return;

  // Build INSERT statement with ON CONFLICT DO NOTHING for idempotency
  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const values: any[] = [];
  const valuePlaceholders: string[] = [];

  let paramIndex = 1;
  for (const row of rows) {
    const rowPlaceholders: string[] = [];
    for (const col of columns) {
      rowPlaceholders.push(`$${paramIndex++}`);
      values.push(row[col]);
    }
    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const insertQuery = `
    INSERT INTO "${schemaName}"."${tableName}" (${columnList})
    VALUES ${valuePlaceholders.join(', ')}
    ON CONFLICT DO NOTHING
  `;

  await client.query(insertQuery, values);
}

/**
 * Insert batch of rows into target table (backward compatibility)
 * Uses ON CONFLICT DO NOTHING for safety (idempotent inserts)
 */
async function insertBatch(
  pool: Pool,
  tableName: string,
  schemaName: string,
  columns: string[],
  rows: any[]
): Promise<void> {
  if (rows.length === 0) return;

  // Build INSERT statement with ON CONFLICT DO NOTHING for idempotency
  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const values: any[] = [];
  const valuePlaceholders: string[] = [];

  let paramIndex = 1;
  for (const row of rows) {
    const rowPlaceholders: string[] = [];
    for (const col of columns) {
      rowPlaceholders.push(`$${paramIndex++}`);
      values.push(row[col]);
    }
    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const insertQuery = `
    INSERT INTO "${schemaName}"."${tableName}" (${columnList})
    VALUES ${valuePlaceholders.join(', ')}
    ON CONFLICT DO NOTHING
  `;

  await pool.query(insertQuery, values);
}

/**
 * Migrate multiple tables
 */
export async function migrateMultipleTables(
  sourcePool: Pool,
  targetPool: Pool,
  tableNames: string[],
  baseOptions: Partial<MigrationOptions>
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const tableName of tableNames) {
    const result = await migrateTableData(sourcePool, targetPool, {
      ...baseOptions,
      tableName,
    });
    results.push(result);
  }

  return results;
}

/**
 * Get migration summary statistics
 */
export function getMigrationSummary(results: MigrationResult[]): {
  totalTables: number;
  totalRowsMigrated: number;
  tablesSkipped: number;
  totalDuration: number;
} {
  return {
    totalTables: results.length,
    totalRowsMigrated: results.reduce((sum, r) => sum + r.rowsMigrated, 0),
    tablesSkipped: results.filter((r) => r.skipped).length,
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}
