/**
 * Control Plane Tables
 * 
 * These tables ALWAYS remain in Supabase (Control Plane)
 * and are NEVER migrated to city-specific Neon databases.
 * 
 * They manage global platform state:
 * - City configurations
 * - User authentication
 * - Platform-wide roles and permissions
 * - Cross-city relationships
 */

export const CONTROL_PLANE_TABLES = [
  /**
   * MULTI-TENANT MANAGEMENT
   */
  'cities',                       // City configurations (themes, logos, db_url)
  
  /**
   * AUTHENTICATION & USERS
   * Note: auth.users is managed by Supabase Auth, not public schema
   */
  'profiles',                     // User profiles (single source of truth)
  
  /**
   * ROLES & PERMISSIONS
   */
  'roles',                        // Available roles (admin, secretario, professor, etc)
  'user_roles',                   // User → Role assignments (many-to-many)
  'user_relationships',           // User relationships (pai-filho, tutor, etc)
  
  /**
   * SECRETARIAS (DEPARTMENTS)
   */
  'secretarias',                  // Municipal departments/secretariats
  'secretary_assignments',        // User → Secretaria assignments
  'secretary_requests',           // Inter-secretariat requests
  
  /**
   * PLATFORM SETTINGS
   */
  'app_settings',                 // Global app configuration
] as const;

export type ControlPlaneTable = (typeof CONTROL_PLANE_TABLES)[number];

/**
 * Check if a table is part of Control Plane
 */
export function isControlPlaneTable(tableName: string): boolean {
  return CONTROL_PLANE_TABLES.includes(tableName as ControlPlaneTable);
}

/**
 * Get all control plane tables as array
 */
export function getControlPlaneTables(): readonly string[] {
  return CONTROL_PLANE_TABLES;
}
