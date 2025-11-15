/**
 * Enable Module
 * 
 * Enables an additional module for an existing city.
 * - Syncs schema for the module
 * - Optionally migrates data if source data exists
 * 
 * Used when a city wants to add a new feature/module after initial setup.
 */

import { ModuleKey } from '../config/modules';
import { syncModuleSchema } from './sync-module-schema';
import { migrateModuleData } from './migrate-module-data';
import { getCityNeonPool, getCityFromControlPlane } from '../utils/connections';
import { logger } from '../utils/logger';

/**
 * Options for enabling a module
 */
export interface EnableModuleOptions {
  citySlug: string;
  moduleKey: ModuleKey;
  migrateData?: boolean; // Whether to migrate data (if exists)
  cityIdFilter?: string; // Filter for city-specific data
  skipSchemaIfExists?: boolean;
}

/**
 * Result of enabling module
 */
export interface EnableModuleResult {
  citySlug: string;
  moduleKey: ModuleKey;
  tablesCreated: number;
  rowsMigrated: number;
  duration: number;
}

/**
 * Enable a module for a city
 */
export async function enableModule(
  options: EnableModuleOptions
): Promise<EnableModuleResult> {
  const startTime = Date.now();
  const {
    citySlug,
    moduleKey,
    migrateData = false,
    cityIdFilter,
    skipSchemaIfExists = true,
  } = options;

  logger.info({ citySlug, moduleKey }, '🔧 Enabling module...');

  // Verify city exists and has db_url
  const city = await getCityFromControlPlane(citySlug);
  if (!city) {
    throw new Error(`City "${citySlug}" not found in cities table`);
  }
  if (!city.db_url) {
    throw new Error(`City "${citySlug}" does not have db_url set. Provision the city first.`);
  }

  // Connect to city's Neon database
  const targetPool = await getCityNeonPool(citySlug, city.db_url);

  // STEP 1: Sync schema
  logger.info({ citySlug, moduleKey }, '📋 Syncing module schema...');
  const schemaResult = await syncModuleSchema({
    moduleKey,
    citySlug,
    targetPool,
    skipExisting: skipSchemaIfExists,
  });

  logger.success(
    { citySlug, moduleKey },
    `Schema synced: ${schemaResult.tablesCreated.length} tables created`
  );

  let rowsMigrated = 0;

  // STEP 2: Optionally migrate data
  if (migrateData) {
    logger.info({ citySlug, moduleKey }, '📊 Migrating module data...');
    const dataResult = await migrateModuleData({
      moduleKey,
      citySlug,
      cityIdFilter,
      targetPool,
    });

    rowsMigrated = dataResult.totalRowsMigrated;
    logger.success(
      { citySlug, moduleKey },
      `Data migrated: ${rowsMigrated.toLocaleString()} rows`
    );
  }

  const duration = Date.now() - startTime;
  const durationSeconds = (duration / 1000).toFixed(2);

  logger.success({ citySlug, moduleKey }, `✨ Module enabled in ${durationSeconds}s`);

  return {
    citySlug,
    moduleKey,
    tablesCreated: schemaResult.tablesCreated.length,
    rowsMigrated,
    duration,
  };
}

/**
 * CLI entry point
 */
export async function main() {
  const citySlug = process.argv[2];
  const moduleKey = process.argv[3] as ModuleKey;
  const migrateDataArg = process.argv[4];

  if (!citySlug || !moduleKey) {
    console.error('Usage: node enable-module.js <city-slug> <module-key> [migrate-data]');
    console.error('Example: node enable-module.js recife transparencia true');
    process.exit(1);
  }

  const migrateData = migrateDataArg === 'true';

  try {
    const result = await enableModule({
      citySlug,
      moduleKey,
      migrateData,
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎉 MODULE ENABLED');
    console.log('='.repeat(80));
    console.log(`City: ${result.citySlug}`);
    console.log(`Module: ${result.moduleKey}`);
    console.log(`Tables Created: ${result.tablesCreated}`);
    console.log(`Rows Migrated: ${result.rowsMigrated.toLocaleString()}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ MODULE ENABLE FAILED');
    console.error('='.repeat(80));
    console.error(error);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
}

// Allow running this file directly
if (require.main === module) {
  main();
}
