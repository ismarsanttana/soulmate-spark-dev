#!/usr/bin/env node
/**
 * Conecta Multi-Tenant Migration CLI
 * 
 * Command-line interface for managing city provisioning and migrations.
 * 
 * Commands:
 * - provision:afogados - Migrate Afogados from Supabase to Neon
 * - provision:city <slug> [modules] - Create new city database
 * - enable:module <slug> <module> - Enable module for existing city
 * - test:connections - Test database connections
 */

import { Command } from 'commander';
import { provisionAfogados } from './commands/provision-afogados';
import { provisionNewCity } from './commands/provision-new-city';
import { enableModule } from './commands/enable-module';
import { testConnection, getSupabasePool, getNeonAdminPool, closeAllPools } from './utils/connections';
import { getAllModules, ModuleKey } from './config/modules';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('conecta-migrations')
  .description('Conecta Multi-Tenant Migration CLI')
  .version('1.0.0');

/**
 * Command: provision:afogados
 * Migrate Afogados da Ingazeira from Supabase to Neon
 */
program
  .command('provision:afogados')
  .description('Migrate Afogados da Ingazeira from Supabase to Neon (ONE-TIME migration)')
  .option('-m, --modules <modules>', 'Comma-separated list of modules (default: all)')
  .option('--batch-size <size>', 'Data migration batch size', '1000')
  .action(async (options) => {
    try {
      const modulesToProvision = options.modules
        ? (options.modules.split(',') as ModuleKey[])
        : getAllModules();

      const batchSize = parseInt(options.batchSize, 10);

      logger.info({}, '🚀 Starting Afogados provisioning...');
      logger.info({}, `Modules: ${modulesToProvision.join(', ')}`);
      logger.info({}, `Batch size: ${batchSize}`);

      const result = await provisionAfogados({
        modulesToProvision,
        batchSize,
      });

      console.log('\n' + '='.repeat(80));
      console.log('🎉 AFOGADOS PROVISIONING SUCCESSFUL');
      console.log('='.repeat(80));
      console.log(`Database: ${result.databaseName}`);
      console.log(`Connection String: ${result.connectionString.replace(/:[^:@]+@/, ':****@')}`);
      console.log(`Modules: ${result.modulesProvisioned.join(', ')}`);
      console.log(`Tables Created: ${result.totalTablesCreated}`);
      console.log(`Rows Migrated: ${result.totalRowsMigrated.toLocaleString()}`);
      console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
      console.log('='.repeat(80) + '\n');

      await closeAllPools();
      process.exit(0);
    } catch (error) {
      console.error('\n❌ PROVISIONING FAILED\n');
      console.error(error);
      await closeAllPools();
      process.exit(1);
    }
  });

/**
 * Command: provision:city
 * Create a new city database (empty, no data migration)
 */
program
  .command('provision:city <slug>')
  .description('Create a new city database with selected modules (empty, no data)')
  .argument('<slug>', 'City slug (e.g., recife, salvador)')
  .option('-m, --modules <modules>', 'Comma-separated list of modules', 'educacao,saude,conteudo,ouvidoria')
  .action(async (slug: string, options) => {
    try {
      const enabledModules = options.modules.split(',') as ModuleKey[];

      logger.info({}, `🚀 Provisioning new city: ${slug}`);
      logger.info({}, `Enabled modules: ${enabledModules.join(', ')}`);

      const result = await provisionNewCity({
        citySlug: slug,
        enabledModules,
      });

      console.log('\n' + '='.repeat(80));
      console.log('🎉 NEW CITY PROVISIONED');
      console.log('='.repeat(80));
      console.log(`City: ${result.citySlug}`);
      console.log(`Database: ${result.databaseName}`);
      console.log(`Connection String: ${result.connectionString.replace(/:[^:@]+@/, ':****@')}`);
      console.log(`Modules Enabled: ${result.modulesEnabled.join(', ')}`);
      console.log(`Tables Created: ${result.tablesCreated}`);
      console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
      console.log('='.repeat(80) + '\n');

      await closeAllPools();
      process.exit(0);
    } catch (error) {
      console.error('\n❌ CITY PROVISIONING FAILED\n');
      console.error(error);
      await closeAllPools();
      process.exit(1);
    }
  });

/**
 * Command: enable:module
 * Enable a module for an existing city
 */
program
  .command('enable:module <slug> <module>')
  .description('Enable an additional module for an existing city')
  .argument('<slug>', 'City slug')
  .argument('<module>', 'Module key (educacao, saude, conteudo, etc)')
  .option('--migrate-data', 'Migrate data for this module', false)
  .option('--city-id <id>', 'City ID filter for data migration')
  .action(async (slug: string, module: string, options) => {
    try {
      logger.info({}, `🔧 Enabling module "${module}" for city "${slug}"`);

      const result = await enableModule({
        citySlug: slug,
        moduleKey: module as ModuleKey,
        migrateData: options.migrateData,
        cityIdFilter: options.cityId,
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

      await closeAllPools();
      process.exit(0);
    } catch (error) {
      console.error('\n❌ MODULE ENABLE FAILED\n');
      console.error(error);
      await closeAllPools();
      process.exit(1);
    }
  });

/**
 * Command: test:connections
 * Test database connections
 */
program
  .command('test:connections')
  .description('Test connections to Supabase and Neon')
  .action(async () => {
    console.log('🔌 Testing database connections...\n');

    try {
      // Test Supabase
      const supabasePool = getSupabasePool();
      await testConnection(supabasePool, '1. Supabase (Control Plane + Data)');

      // Test Neon Admin
      const neonAdminPool = getNeonAdminPool();
      await testConnection(neonAdminPool, '2. Neon Admin');

      console.log('\n✅ All connections successful!\n');
      await closeAllPools();
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Connection test failed\n');
      console.error(error);
      await closeAllPools();
      process.exit(1);
    }
  });

/**
 * Command: list:modules
 * List available modules
 */
program
  .command('list:modules')
  .description('List all available modules')
  .action(() => {
    console.log('\n📦 Available Modules:\n');
    const modules = getAllModules();
    modules.forEach((mod) => {
      console.log(`  - ${mod}`);
    });
    console.log('');
    process.exit(0);
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
