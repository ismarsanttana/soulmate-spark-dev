/**
 * Provision Afogados da Ingazeira
 * 
 * Main orchestrator for migrating Afogados from Supabase to Neon.
 * 
 * Steps:
 * 1. Create Neon database for Afogados
 * 2. Sync schema for all modules
 * 3. Migrate data for all modules
 * 4. Update cities.db_url in Control Plane
 * 
 * This is a ONE-TIME migration for the initial city.
 * Future cities will use provision-new-city.ts instead.
 */

import { getAllModules, ModuleKey } from '../config/modules';
import { createNeonDatabase } from './create-neon-database';
import { syncMultipleModules } from './sync-module-schema';
import { migrateMultipleModules } from './migrate-module-data';
import { getCityNeonPool, updateCityDbUrl, getCityFromControlPlane } from '../utils/connections';
import { logger } from '../utils/logger';

/**
 * Options for provisioning Afogados
 */
export interface ProvisionAfogadosOptions {
  citySlug?: string; // Defaults to 'afogados-da-ingazeira'
  modulesToProvision?: ModuleKey[]; // Defaults to ALL modules
  skipSchemaIfExists?: boolean; // Skip tables that already exist
  skipDataIfExists?: boolean; // Skip migration if target has rows
  truncateBeforeInsert?: boolean; // TRUNCATE tables before inserting (for safe re-runs)
  batchSize?: number; // Data migration batch size
}

/**
 * Result of provisioning
 */
export interface ProvisionAfogadosResult {
  citySlug: string;
  databaseName: string;
  connectionString: string;
  modulesProvisioned: ModuleKey[];
  totalTablesCreated: number;
  totalRowsMigrated: number;
  duration: number;
}

/**
 * Provision Afogados da Ingazeira
 */
export async function provisionAfogados(
  options: ProvisionAfogadosOptions = {}
): Promise<ProvisionAfogadosResult> {
  const startTime = Date.now();
  const {
    citySlug = 'afogados-da-ingazeira',
    modulesToProvision = getAllModules(),
    skipSchemaIfExists = true,
    skipDataIfExists = true,
    truncateBeforeInsert = false,
    batchSize = 1000,
  } = options;

  logger.cityStart(citySlug);

  // Verify city exists in Control Plane
  const city = await getCityFromControlPlane(citySlug);
  if (!city) {
    throw new Error(`City "${citySlug}" not found in cities table`);
  }

  // STEP 1: Create Neon database
  logger.info({ citySlug }, '📦 Step 1/4: Creating Neon database...');
  const dbResult = await createNeonDatabase({ citySlug });

  // STEP 2: Get connection to new database
  logger.info({ citySlug }, '🔌 Step 2/4: Connecting to Neon database...');
  const targetPool = await getCityNeonPool(citySlug, dbResult.connectionString);

  // STEP 3: Sync schema for all modules
  logger.info({ citySlug }, `📋 Step 3/4: Syncing schema for ${modulesToProvision.length} modules...`);
  const schemaResults = await syncMultipleModules(
    modulesToProvision,
    citySlug,
    targetPool,
    skipSchemaIfExists
  );

  const totalTablesCreated = schemaResults.reduce(
    (sum, r) => sum + r.tablesCreated.length,
    0
  );

  logger.success({ citySlug }, `Schema synced: ${totalTablesCreated} tables created`);

  // STEP 4: Migrate data for all modules
  logger.info({ citySlug }, `📊 Step 4/4: Migrating data for ${modulesToProvision.length} modules...`);
  logger.info({ citySlug }, 'Using city_id filter: NULL (Afogados legacy data without city_id)');

  // Note: If truncateBeforeInsert=true, we override skipDataIfExists
  const effectiveSkipIfExists = truncateBeforeInsert ? false : skipDataIfExists;

  const dataResults = await migrateMultipleModules(
    modulesToProvision,
    citySlug,
    targetPool,
    null, // cityIdFilter = null means "WHERE city_id IS NULL" for Afogados legacy data
    batchSize,
    effectiveSkipIfExists,
    truncateBeforeInsert
  );

  const totalRowsMigrated = dataResults.reduce(
    (sum, r) => sum + r.totalRowsMigrated,
    0
  );

  logger.success({ citySlug }, `Data migrated: ${totalRowsMigrated.toLocaleString()} total rows`);

  // STEP 5: Update cities.db_url in Control Plane
  logger.info({ citySlug }, '🔄 Updating cities table with db_url...');
  await updateCityDbUrl(citySlug, dbResult.connectionString);

  const duration = Date.now() - startTime;
  const durationSeconds = (duration / 1000).toFixed(2);

  logger.cityComplete(
    citySlug,
    modulesToProvision.length,
    totalTablesCreated,
    totalRowsMigrated
  );

  logger.success(
    { citySlug },
    `✨ Provisioning complete in ${durationSeconds}s`
  );

  return {
    citySlug,
    databaseName: dbResult.databaseName,
    connectionString: dbResult.connectionString,
    modulesProvisioned: modulesToProvision,
    totalTablesCreated,
    totalRowsMigrated,
    duration,
  };
}

/**
 * CLI entry point
 */
export async function main() {
  try {
    const result = await provisionAfogados();
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 PROVISIONING SUCCESSFUL');
    console.log('='.repeat(80));
    console.log(`City: ${result.citySlug}`);
    console.log(`Database: ${result.databaseName}`);
    console.log(`Modules: ${result.modulesProvisioned.join(', ')}`);
    console.log(`Tables Created: ${result.totalTablesCreated}`);
    console.log(`Rows Migrated: ${result.totalRowsMigrated.toLocaleString()}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ PROVISIONING FAILED');
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
