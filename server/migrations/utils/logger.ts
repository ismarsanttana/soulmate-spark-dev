/**
 * Migration Logger
 * 
 * Provides structured logging for migration operations.
 * Format: [MIGRATION] city > module > table: message
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface MigrationContext {
  citySlug?: string;
  moduleKey?: string;
  tableName?: string;
}

class MigrationLogger {
  private getPrefix(context: MigrationContext): string {
    const parts = ['MIGRATION'];
    
    if (context.citySlug) parts.push(context.citySlug);
    if (context.moduleKey) parts.push(context.moduleKey);
    if (context.tableName) parts.push(context.tableName);
    
    return `[${parts.join(' > ')}]`;
  }

  private formatMessage(level: LogLevel, context: MigrationContext, message: string, ...args: any[]): string {
    const prefix = this.getPrefix(context);
    const levelIcon = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
    }[level];
    
    return `${levelIcon} ${prefix} ${message}`;
  }

  info(context: MigrationContext, message: string, ...args: any[]): void {
    console.log(this.formatMessage('info', context, message), ...args);
  }

  success(context: MigrationContext, message: string, ...args: any[]): void {
    console.log(this.formatMessage('success', context, message), ...args);
  }

  warn(context: MigrationContext, message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', context, message), ...args);
  }

  error(context: MigrationContext, message: string, error?: Error | unknown): void {
    const errorMsg = this.formatMessage('error', context, message);
    console.error(errorMsg);
    if (error) {
      console.error(error);
    }
  }

  /**
   * Log data migration statistics
   */
  dataMigration(citySlug: string, moduleKey: string, tableName: string, rowCount: number): void {
    this.success(
      { citySlug, moduleKey, tableName },
      `${rowCount.toLocaleString()} rows migrated`
    );
  }

  /**
   * Log schema creation
   */
  schemaCreated(citySlug: string, moduleKey: string, tableName: string): void {
    this.success(
      { citySlug, moduleKey, tableName },
      'Schema created'
    );
  }

  /**
   * Log database creation
   */
  databaseCreated(citySlug: string, databaseName: string): void {
    this.success(
      { citySlug },
      `Database "${databaseName}" created`
    );
  }

  /**
   * Log module provisioning start
   */
  moduleStart(citySlug: string, moduleKey: string): void {
    this.info(
      { citySlug, moduleKey },
      'Starting module provisioning...'
    );
  }

  /**
   * Log module provisioning completion
   */
  moduleComplete(citySlug: string, moduleKey: string, tableCount: number, totalRows: number): void {
    this.success(
      { citySlug, moduleKey },
      `Provisioned ${tableCount} tables, ${totalRows.toLocaleString()} total rows`
    );
  }

  /**
   * Log city provisioning start
   */
  cityStart(citySlug: string): void {
    this.info(
      { citySlug },
      '🚀 Starting city provisioning...'
    );
  }

  /**
   * Log city provisioning completion
   */
  cityComplete(citySlug: string, moduleCount: number, totalTables: number, totalRows: number): void {
    this.success(
      { citySlug },
      `🎉 City provisioned: ${moduleCount} modules, ${totalTables} tables, ${totalRows.toLocaleString()} rows`
    );
  }

  /**
   * Log skipped operation
   */
  skipped(context: MigrationContext, reason: string): void {
    this.info(context, `Skipped: ${reason}`);
  }
}

export const logger = new MigrationLogger();
