/**
 * Schema Reader
 * 
 * Reads complete table schema from Supabase using PostgreSQL information_schema
 * and system catalogs.
 * 
 * Extracts:
 * - Columns (name, type, nullable, default)
 * - Primary keys
 * - Foreign keys
 * - Unique constraints
 * - Indexes
 * - Check constraints
 */

import { Pool } from 'pg';
import { logger } from './logger';

/**
 * Column definition
 */
export interface ColumnDefinition {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
  udtName: string; // Underlying data type (e.g., 'uuid', 'text')
  ordinalPosition: number;
}

/**
 * Primary key definition
 */
export interface PrimaryKeyDefinition {
  constraintName: string;
  columns: string[];
}

/**
 * Foreign key definition
 */
export interface ForeignKeyDefinition {
  constraintName: string;
  columns: string[];
  foreignTable: string;
  foreignColumns: string[];
  onDelete: string;
  onUpdate: string;
}

/**
 * Unique constraint definition
 */
export interface UniqueConstraintDefinition {
  constraintName: string;
  columns: string[];
}

/**
 * Check constraint definition
 */
export interface CheckConstraintDefinition {
  constraintName: string;
  checkClause: string;
}

/**
 * Index definition
 */
export interface IndexDefinition {
  indexName: string;
  columns: string[];
  isUnique: boolean;
  indexType: string; // btree, hash, gin, gist, etc.
  indexDef: string; // Full CREATE INDEX statement
}

/**
 * Sequence definition
 */
export interface SequenceDefinition {
  sequenceName: string;
  ownedByColumn: string | null; // Column that owns this sequence
  dataType: string;
  startValue: number;
  incrementBy: number;
  maxValue: number | null;
  minValue: number | null;
  cacheSize: number;
}

/**
 * Enum type definition
 */
export interface EnumTypeDefinition {
  typeName: string;
  values: string[];
}

/**
 * Complete table schema
 */
export interface TableSchema {
  schemaName: string;
  tableName: string;
  columns: ColumnDefinition[];
  primaryKey: PrimaryKeyDefinition | null;
  foreignKeys: ForeignKeyDefinition[];
  uniqueConstraints: UniqueConstraintDefinition[];
  checkConstraints: CheckConstraintDefinition[];
  indexes: IndexDefinition[];
  sequences: SequenceDefinition[];
  enumTypes: EnumTypeDefinition[];
}

/**
 * Read complete schema for a table
 */
export async function readTableSchema(
  pool: Pool,
  tableName: string,
  schemaName: string = 'public'
): Promise<TableSchema> {
  logger.info({ tableName }, 'Reading table schema...');

  const [
    columns,
    primaryKey,
    foreignKeys,
    uniqueConstraints,
    checkConstraints,
    indexes,
    sequences,
    enumTypes,
  ] = await Promise.all([
    readColumns(pool, tableName, schemaName),
    readPrimaryKey(pool, tableName, schemaName),
    readForeignKeys(pool, tableName, schemaName),
    readUniqueConstraints(pool, tableName, schemaName),
    readCheckConstraints(pool, tableName, schemaName),
    readIndexes(pool, tableName, schemaName),
    readSequences(pool, tableName, schemaName),
    readEnumTypes(pool, tableName, schemaName),
  ]);

  logger.success(
    { tableName },
    `Schema read: ${columns.length} cols, ${foreignKeys.length} FKs, ${indexes.length} indexes, ${sequences.length} seqs, ${enumTypes.length} enums`
  );

  return {
    schemaName,
    tableName,
    columns,
    primaryKey,
    foreignKeys,
    uniqueConstraints,
    checkConstraints,
    indexes,
    sequences,
    enumTypes,
  };
}

/**
 * Read columns from information_schema
 */
async function readColumns(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<ColumnDefinition[]> {
  const query = `
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      udt_name,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
    ORDER BY ordinal_position
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  return result.rows.map((row) => ({
    columnName: row.column_name,
    dataType: row.data_type,
    isNullable: row.is_nullable === 'YES',
    columnDefault: row.column_default,
    characterMaximumLength: row.character_maximum_length,
    numericPrecision: row.numeric_precision,
    numericScale: row.numeric_scale,
    udtName: row.udt_name,
    ordinalPosition: row.ordinal_position,
  }));
}

/**
 * Read primary key constraint
 */
async function readPrimaryKey(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<PrimaryKeyDefinition | null> {
  const query = `
    SELECT
      tc.constraint_name,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = $1
      AND tc.table_name = $2
      AND tc.constraint_type = 'PRIMARY KEY'
    GROUP BY tc.constraint_name
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  if (result.rows.length === 0) {
    return null;
  }

  return {
    constraintName: result.rows[0].constraint_name,
    columns: result.rows[0].columns,
  };
}

/**
 * Read foreign key constraints
 */
async function readForeignKeys(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<ForeignKeyDefinition[]> {
  const query = `
    SELECT
      tc.constraint_name,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns,
      ccu.table_name as foreign_table,
      array_agg(ccu.column_name ORDER BY kcu.ordinal_position) as foreign_columns,
      rc.delete_rule as on_delete,
      rc.update_rule as on_update
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = $1
      AND tc.table_name = $2
      AND tc.constraint_type = 'FOREIGN KEY'
    GROUP BY tc.constraint_name, ccu.table_name, rc.delete_rule, rc.update_rule
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  return result.rows.map((row) => ({
    constraintName: row.constraint_name,
    columns: row.columns,
    foreignTable: row.foreign_table,
    foreignColumns: row.foreign_columns,
    onDelete: row.on_delete.toUpperCase(),
    onUpdate: row.on_update.toUpperCase(),
  }));
}

/**
 * Read unique constraints
 */
async function readUniqueConstraints(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<UniqueConstraintDefinition[]> {
  const query = `
    SELECT
      tc.constraint_name,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = $1
      AND tc.table_name = $2
      AND tc.constraint_type = 'UNIQUE'
    GROUP BY tc.constraint_name
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  return result.rows.map((row) => ({
    constraintName: row.constraint_name,
    columns: row.columns,
  }));
}

/**
 * Read check constraints
 */
async function readCheckConstraints(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<CheckConstraintDefinition[]> {
  const query = `
    SELECT
      cc.constraint_name,
      cc.check_clause
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc
      ON cc.constraint_name = tc.constraint_name
      AND cc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = $1
      AND tc.table_name = $2
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  return result.rows.map((row) => ({
    constraintName: row.constraint_name,
    checkClause: row.check_clause,
  }));
}

/**
 * Read indexes from pg_catalog
 */
async function readIndexes(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<IndexDefinition[]> {
  const query = `
    SELECT
      i.relname as index_name,
      a.attname as column_name,
      ix.indisunique as is_unique,
      am.amname as index_type,
      pg_get_indexdef(ix.indexrelid) as index_def,
      a.attnum
    FROM pg_class t
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = $1
      AND t.relname = $2
      AND NOT ix.indisprimary
    ORDER BY i.relname, a.attnum
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  // Group columns by index name
  const indexMap = new Map<string, IndexDefinition>();

  for (const row of result.rows) {
    if (!indexMap.has(row.index_name)) {
      indexMap.set(row.index_name, {
        indexName: row.index_name,
        columns: [],
        isUnique: row.is_unique,
        indexType: row.index_type,
        indexDef: row.index_def,
      });
    }
    indexMap.get(row.index_name)!.columns.push(row.column_name);
  }

  return Array.from(indexMap.values());
}

/**
 * Check if table exists
 */
export async function tableExists(
  pool: Pool,
  tableName: string,
  schemaName: string = 'public'
): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = $2
    ) as exists
  `;

  const result = await pool.query(query, [schemaName, tableName]);
  return result.rows[0].exists;
}

/**
 * Check if table is empty
 */
export async function isTableEmpty(
  pool: Pool,
  tableName: string,
  schemaName: string = 'public'
): Promise<boolean> {
  const query = `SELECT EXISTS (SELECT 1 FROM "${schemaName}"."${tableName}" LIMIT 1) as has_rows`;
  const result = await pool.query(query);
  return !result.rows[0].has_rows;
}

/**
 * Get row count for table
 */
export async function getTableRowCount(
  pool: Pool,
  tableName: string,
  schemaName: string = 'public'
): Promise<number> {
  const query = `SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}"`;
  const result = await pool.query(query);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Read sequences owned by table columns
 * Only returns sequences explicitly owned by columns of THIS table
 */
async function readSequences(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<SequenceDefinition[]> {
  const query = `
    SELECT DISTINCT
      c.relname as sequence_name,
      a.attname as owned_by_column,
      'bigint' as data_type,
      1 as start_value,
      1 as increment_by,
      NULL::bigint as max_value,
      NULL::bigint as min_value,
      1 as cache_size
    FROM pg_class c
    JOIN pg_depend d ON d.objid = c.oid
    JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.relkind = 'S' -- Sequence
      AND d.deptype = 'a' -- Auto dependency (owned by)
      AND t.relname = $2
      AND n.nspname = $1
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  return result.rows.map((row) => ({
    sequenceName: row.sequence_name,
    ownedByColumn: row.owned_by_column,
    dataType: row.data_type,
    startValue: parseInt(row.start_value, 10),
    incrementBy: parseInt(row.increment_by, 10),
    maxValue: row.max_value ? parseInt(row.max_value, 10) : null,
    minValue: row.min_value ? parseInt(row.min_value, 10) : null,
    cacheSize: parseInt(row.cache_size, 10),
  }));
}

/**
 * Read enum types used by table columns
 */
async function readEnumTypes(
  pool: Pool,
  tableName: string,
  schemaName: string
): Promise<EnumTypeDefinition[]> {
  const query = `
    SELECT DISTINCT
      t.typname as type_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN (
      SELECT DISTINCT udt_name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
        AND data_type = 'USER-DEFINED'
    )
    GROUP BY t.typname
  `;

  const result = await pool.query(query, [schemaName, tableName]);

  return result.rows.map((row) => ({
    typeName: row.type_name,
    values: row.enum_values,
  }));
}
