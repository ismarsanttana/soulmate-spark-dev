/**
 * Domain Types - UrbanByte Multi-Tenant Architecture
 * 
 * Defines the types and enums for domain-based routing.
 * Each domain represents a different application context.
 */

/**
 * Application Domain Types
 * 
 * - ROOT: urbanbyte.com.br (Marketing/Institutional site)
 * - MASTER: dash.urbanbyte.com.br (UrbanByte Control Center - platform admin)
 * - COLLABORATOR: colaborador.urbanbyte.com.br (Internal team panel)
 * - PARTNER: parceiro.urbanbyte.com.br (Partner/Reseller panel)
 * - CITY: {subdomain}.urbanbyte.com.br (City-specific citizen portal)
 */
export enum DomainType {
  ROOT = 'root',
  MASTER = 'master',
  COLLABORATOR = 'collaborator',
  PARTNER = 'partner',
  CITY = 'city',
}

/**
 * Platform User Roles (from platform_users table)
 */
export enum PlatformRole {
  MASTER = 'MASTER',     // UrbanByte superadmin (access to dash.*)
  TEAM = 'TEAM',         // Internal team member (access to colaborador.*)
  PARTNER = 'PARTNER',   // Partner/Reseller (access to parceiro.*)
}

/**
 * Domain Context
 * Contains information about the current domain/subdomain
 */
export interface DomainContext {
  type: DomainType;
  subdomain: string | null;  // e.g., "afogados", "zabele" for CITY type
  hostname: string;          // Full hostname
  isProduction: boolean;     // True if using real domains, false if dev mode
}

/**
 * City Context
 * Additional information when domain type is CITY
 */
export interface CityContext extends DomainContext {
  type: DomainType.CITY;
  subdomain: string;         // Required for city context
  citySlug?: string;         // Resolved from database
  cityId?: number;           // Resolved from database
}

/**
 * Domain Access Result
 * Result of domain access validation
 */
export interface DomainAccessResult {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
}
