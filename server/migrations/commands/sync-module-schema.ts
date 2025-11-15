/**
 * Sync Module Schema
 * 
 * Synchronizes schema for a specific module from Supabase to Neon.
 * - Reads table schemas from Supabase
 * - Generates DDL statements
 * - Creates tables in Neon if they don't exist
 * - Adds constraints and indexes
 */

import { Pool } from 'pg';
import { getModuleTables, ModuleKey } from '../config/modules';
import { getSupabasePool } from '../utils/connections';
import { readTableSchema, tableExists } from '../utils/schema-reader';
import { generateTableDDL } from '../utils/ddl-generator';
import { logger } from '../utils/logger';

/**
 * Options for schema sync
 */
export interface SyncModuleSchemaOptions {
  moduleKey: ModuleKey;
  citySlug: string;
  targetPool: Pool;
  skipExisting?: boolean; // Skip tables that already exist
}

/**
 * Result of schema sync
 */
export interface SyncModuleSchemaResult {
  moduleKey: ModuleKey;
  tablesCreated: string[];
  tablesSkipped: string[];
  totalStatements: number;
}

/**
 * Sync schema for a module
 */
export async function syncModuleSchema(
  options: SyncModuleSchemaOptions
): Promise<SyncModuleSchemaResult> {
  const { moduleKey, citySlug, targetPool, skipExisting = true } = options;

  logger.moduleStart(citySlug, moduleKey);

  const sourcePool = getSupabasePool();
  const tablesToMigrate = getModuleTables(moduleKey);

  const tablesCreated: string[] = [];
  const tablesSkipped: string[] = [];
  let totalStatements = 0;

  for (const tableName of tablesToMigrate) {
    try {
      // Check if table exists in target
      const exists = await tableExists(targetPool, tableName);
      
      if (exists && skipExisting) {
        logger.skipped({ citySlug, moduleKey, tableName }, 'Table already exists');
        tablesSkipped.push(tableName);
        continue;
      }

      // Read schema from source
      const schema = await readTableSchema(sourcePool, tableName);

      // Generate DDL
      const ddl = generateTableDDL(schema);

      // Execute DDL statements
      for (const statement of ddl.allStatements) {
        await targetPool.query(statement);
        totalStatements++;
      }

      logger.schemaCreated(citySlug, moduleKey, tableName);
      tablesCreated.push(tableName);

    } catch (error) {
      logger.error({ citySlug, moduleKey, tableName }, 'Failed to sync schema', error);
      throw error;
    }
  }

  const summary = {
    moduleKey,
    tablesCreated,
    tablesSkipped,
    totalStatements,
  };

  logger.success(
    { citySlug, moduleKey },
    `Schema synced: ${tablesCreated.length} tables created, ${tablesSkipped.length} skipped`
  );

  return summary;
}

/**
 * Sync schema for multiple modules
 */
export async function syncMultipleModules(
  moduleKeys: ModuleKey[],
  citySlug: string,
  targetPool: Pool,
  skipExisting?: boolean
): Promise<SyncModuleSchemaResult[]> {
  const results: SyncModuleSchemaResult[] = [];

  for (const moduleKey of moduleKeys) {
    const result = await syncModuleSchema({
      moduleKey,
      citySlug,
      targetPool,
      skipExisting,
    });
    results.push(result);
  }

  return results;
}
