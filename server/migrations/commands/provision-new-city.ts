/**
 * Provision New City
 * 
 * Creates a new city database from scratch (empty, no data migration).
 * Used for onboarding NEW cities that don't have existing data.
 * 
 * Steps:
 * 1. Verify city exists in Control Plane (cities table)
 * 2. Create Neon database
 * 3. Sync schema for enabled modules
 * 4. Update cities.db_url
 * 
 * No data migration - city starts fresh.
 */

import { ModuleKey } from '../config/modules';
import { createNeonDatabase } from './create-neon-database';
import { syncMultipleModules } from './sync-module-schema';
import { getCityNeonPool, updateCityDbUrl, getCityFromControlPlane } from '../utils/connections';
import { logger } from '../utils/logger';

/**
 * Options for provisioning a new city
 */
export interface ProvisionNewCityOptions {
  citySlug: string; // REQUIRED
  enabledModules: ModuleKey[]; // Which modules to enable
  skipSchemaIfExists?: boolean;
}

/**
 * Result of provisioning
 */
export interface ProvisionNewCityResult {
  citySlug: string;
  databaseName: string;
  connectionString: string;
  modulesEnabled: ModuleKey[];
  tablesCreated: number;
  duration: number;
}

/**
 * Provision a new city (empty database, no data)
 */
export async function provisionNewCity(
  options: ProvisionNewCityOptions
): Promise<ProvisionNewCityResult> {
  const startTime = Date.now();
  const { citySlug, enabledModules, skipSchemaIfExists = true } = options;

  logger.cityStart(citySlug);

  // STEP 1: Verify city exists in Control Plane
  logger.info({ citySlug }, 'Verifying city exists in Control Plane...');
  const city = await getCityFromControlPlane(citySlug);
  if (!city) {
    throw new Error(
      `City "${citySlug}" not found in cities table. ` +
      `Please create the city record first with logo, colors, etc.`
    );
  }

  // STEP 2: Create Neon database
  logger.info({ citySlug }, '📦 Creating Neon database...');
  const dbResult = await createNeonDatabase({ citySlug });

  // STEP 3: Connect to new database
  logger.info({ citySlug }, '🔌 Connecting to Neon database...');
  const targetPool = await getCityNeonPool(citySlug, dbResult.connectionString);

  // STEP 4: Sync schema for enabled modules
  logger.info({ citySlug }, `📋 Syncing schema for ${enabledModules.length} modules...`);
  const schemaResults = await syncMultipleModules(
    enabledModules,
    citySlug,
    targetPool,
    skipSchemaIfExists
  );

  const tablesCreated = schemaResults.reduce((sum, r) => sum + r.tablesCreated.length, 0);

  logger.success({ citySlug }, `Schema created: ${tablesCreated} tables`);

  // STEP 5: Update cities.db_url
  logger.info({ citySlug }, '🔄 Updating cities table with db_url...');
  await updateCityDbUrl(citySlug, dbResult.connectionString);

  const duration = Date.now() - startTime;
  const durationSeconds = (duration / 1000).toFixed(2);

  logger.cityComplete(citySlug, enabledModules.length, tablesCreated, 0);
  logger.success({ citySlug }, `✨ City provisioned in ${durationSeconds}s (empty database ready)`);

  return {
    citySlug,
    databaseName: dbResult.databaseName,
    connectionString: dbResult.connectionString,
    modulesEnabled: enabledModules,
    tablesCreated,
    duration,
  };
}

/**
 * CLI entry point
 */
export async function main() {
  const citySlug = process.argv[2];
  const modulesArg = process.argv[3];

  if (!citySlug) {
    console.error('Usage: node provision-new-city.js <city-slug> [modules]');
    console.error('Example: node provision-new-city.js recife educacao,saude,conteudo');
    process.exit(1);
  }

  const enabledModules: ModuleKey[] = modulesArg
    ? (modulesArg.split(',') as ModuleKey[])
    : ['educacao', 'saude', 'conteudo', 'ouvidoria']; // Default modules

  try {
    const result = await provisionNewCity({
      citySlug,
      enabledModules,
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎉 NEW CITY PROVISIONED');
    console.log('='.repeat(80));
    console.log(`City: ${result.citySlug}`);
    console.log(`Database: ${result.databaseName}`);
    console.log(`Modules Enabled: ${result.modulesEnabled.join(', ')}`);
    console.log(`Tables Created: ${result.tablesCreated}`);
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
