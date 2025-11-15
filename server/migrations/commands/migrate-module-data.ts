/**
 * Migrate Module Data
 * 
 * Migrates data for a specific module from Supabase to Neon.
 * - Copies data table by table
 * - Applies city_id filters where applicable
 * - Handles batching and progress tracking
 */

import { Pool } from 'pg';
import { getModuleTables, ModuleKey } from '../config/modules';
import { getSupabasePool } from '../utils/connections';
import { migrateTableData, MigrationResult, getMigrationSummary } from '../utils/data-migrator';
import { logger } from '../utils/logger';

/**
 * Options for data migration
 */
export interface MigrateModuleDataOptions {
  moduleKey: ModuleKey;
  citySlug: string;
  cityIdFilter?: string | null; // Filter for city_id column (null = Afogados without city_id)
  targetPool: Pool;
  batchSize?: number;
  skipIfNotEmpty?: boolean;
}

/**
 * Result of module data migration
 */
export interface MigrateModuleDataResult {
  moduleKey: ModuleKey;
  tableResults: MigrationResult[];
  totalRowsMigrated: number;
  tablesSkipped: number;
  totalDuration: number;
}

/**
 * Migrate data for a module
 */
export async function migrateModuleData(
  options: MigrateModuleDataOptions
): Promise<MigrateModuleDataResult> {
  const {
    moduleKey,
    citySlug,
    cityIdFilter = null,
    targetPool,
    batchSize = 1000,
    skipIfNotEmpty = true,
  } = options;

  logger.moduleStart(citySlug, moduleKey);

  const sourcePool = getSupabasePool();
  const tablesToMigrate = getModuleTables(moduleKey);

  const tableResults: MigrationResult[] = [];

  for (const tableName of tablesToMigrate) {
    try {
      const result = await migrateTableData(sourcePool, targetPool, {
        tableName,
        citySlug,
        cityIdFilter,
        batchSize,
        skipIfNotEmpty,
      });

      tableResults.push(result);

    } catch (error) {
      logger.error({ citySlug, moduleKey, tableName }, 'Failed to migrate data', error);
      throw error;
    }
  }

  const summary = getMigrationSummary(tableResults);

  logger.moduleComplete(
    citySlug,
    moduleKey,
    tablesToMigrate.length,
    summary.totalRowsMigrated
  );

  return {
    moduleKey,
    tableResults,
    totalRowsMigrated: summary.totalRowsMigrated,
    tablesSkipped: summary.tablesSkipped,
    totalDuration: summary.totalDuration,
  };
}

/**
 * Migrate data for multiple modules
 */
export async function migrateMultipleModules(
  moduleKeys: ModuleKey[],
  citySlug: string,
  targetPool: Pool,
  cityIdFilter?: string | null,
  batchSize?: number,
  skipIfNotEmpty?: boolean
): Promise<MigrateModuleDataResult[]> {
  const results: MigrateModuleDataResult[] = [];

  for (const moduleKey of moduleKeys) {
    const result = await migrateModuleData({
      moduleKey,
      citySlug,
      cityIdFilter,
      targetPool,
      batchSize,
      skipIfNotEmpty,
    });
    results.push(result);
  }

  return results;
}
