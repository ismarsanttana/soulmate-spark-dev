/**
 * Domain Context Detection
 * 
 * Detects the current application context based on hostname.
 * Supports both production (real domains) and development (query params).
 */

import { DomainType, type DomainContext } from './domain-types';

/**
 * Reserved subdomains that are NOT city portals
 */
const RESERVED_SUBDOMAINS = ['dash', 'colaborador', 'parceiro', 'www'];

/**
 * Base domain for production
 */
const BASE_DOMAIN = 'urbanbyte.com.br';

/**
 * Check if current environment is development
 * Only allow query param overrides in dev environments
 */
function isDevelopmentEnvironment(): boolean {
  const hostname = window.location.hostname;
  
  // Development hostnames
  const devHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
  ];
  
  // Check exact matches
  if (devHosts.includes(hostname)) {
    return true;
  }
  
  // Check Replit domains
  if (hostname.endsWith('.repl.co') || hostname.endsWith('.replit.dev')) {
    return true;
  }
  
  // Check for explicit dev flag
  if (import.meta.env.DEV) {
    return true;
  }
  
  return false;
}

/**
 * Detect domain context from hostname
 * 
 * Production examples:
 * - urbanbyte.com.br → ROOT
 * - dash.urbanbyte.com.br → MASTER
 * - colaborador.urbanbyte.com.br → COLLABORATOR
 * - parceiro.urbanbyte.com.br → PARTNER
 * - afogados.urbanbyte.com.br → CITY (subdomain: "afogados")
 * 
 * Development mode (query params - ONLY in dev environments):
 * - ?mode=dash → MASTER
 * - ?mode=colaborador → COLLABORATOR
 * - ?mode=parceiro → PARTNER
 * - ?mode=city&subdomain=afogados → CITY
 * - No params → CITY (default dev mode, using DEFAULT_DEV_SUBDOMAIN)
 * 
 * SECURITY: Query params are ONLY allowed in development environments
 * (localhost, *.repl.co, *.replit.dev). In production, they are ignored
 * to prevent domain separation bypass.
 */
export function getDomainContext(): DomainContext {
  const hostname = window.location.hostname;
  
  // Check for dev mode override via query params (ONLY in dev environments)
  const isDevEnv = isDevelopmentEnvironment();
  
  if (isDevEnv) {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const subdomainParam = urlParams.get('subdomain');

    // Development mode with query params
    if (modeParam) {
      return createDevContext(modeParam, subdomainParam);
    }
  }

  // Production mode - detect from hostname
  
  // Check if it's a real domain (contains BASE_DOMAIN)
  if (hostname.includes(BASE_DOMAIN)) {
    return createProductionContext(hostname);
  }

  // Local development (localhost, replit.dev, etc.) - default to CITY mode
  // This allows the existing Conecta app to work in dev without query params
  return {
    type: DomainType.CITY,
    subdomain: getDefaultDevSubdomain(),
    hostname,
    isProduction: false,
  };
}

/**
 * Create context for development mode (query params)
 */
function createDevContext(mode: string, subdomain: string | null): DomainContext {
  const hostname = window.location.hostname;

  switch (mode.toLowerCase()) {
    case 'dash':
    case 'master':
      return {
        type: DomainType.MASTER,
        subdomain: null,
        hostname,
        isProduction: false,
      };

    case 'colaborador':
    case 'collaborator':
    case 'team':
      return {
        type: DomainType.COLLABORATOR,
        subdomain: null,
        hostname,
        isProduction: false,
      };

    case 'parceiro':
    case 'partner':
      return {
        type: DomainType.PARTNER,
        subdomain: null,
        hostname,
        isProduction: false,
      };

    case 'root':
    case 'marketing':
      return {
        type: DomainType.ROOT,
        subdomain: null,
        hostname,
        isProduction: false,
      };

    case 'city':
    case 'cidade':
      return {
        type: DomainType.CITY,
        subdomain: subdomain || getDefaultDevSubdomain(),
        hostname,
        isProduction: false,
      };

    default:
      // Invalid mode - default to CITY
      console.warn(`Unknown mode param: ${mode}. Defaulting to CITY mode.`);
      return {
        type: DomainType.CITY,
        subdomain: getDefaultDevSubdomain(),
        hostname,
        isProduction: false,
      };
  }
}

/**
 * Create context for production mode (real domains)
 */
function createProductionContext(hostname: string): DomainContext {
  // Extract subdomain
  const parts = hostname.split('.');
  
  // urbanbyte.com.br (no subdomain) → ROOT
  if (parts.length === 3 && parts[0] === 'urbanbyte') {
    return {
      type: DomainType.ROOT,
      subdomain: null,
      hostname,
      isProduction: true,
    };
  }

  // www.urbanbyte.com.br → ROOT
  if (parts.length === 4 && parts[0] === 'www') {
    return {
      type: DomainType.ROOT,
      subdomain: null,
      hostname,
      isProduction: true,
    };
  }

  // {subdomain}.urbanbyte.com.br
  if (parts.length === 4) {
    const subdomain = parts[0];

    // Check reserved subdomains
    switch (subdomain) {
      case 'dash':
        return {
          type: DomainType.MASTER,
          subdomain: null,
          hostname,
          isProduction: true,
        };

      case 'colaborador':
        return {
          type: DomainType.COLLABORATOR,
          subdomain: null,
          hostname,
          isProduction: true,
        };

      case 'parceiro':
        return {
          type: DomainType.PARTNER,
          subdomain: null,
          hostname,
          isProduction: true,
        };

      default:
        // Any other subdomain is a CITY
        return {
          type: DomainType.CITY,
          subdomain,
          hostname,
          isProduction: true,
        };
    }
  }

  // Fallback - unexpected hostname format
  // In production, this should never happen with valid domains
  // Return CITY with a placeholder - CityAppShell will show "not found" error
  console.error(`Unexpected hostname format in production: ${hostname}`);
  return {
    type: DomainType.CITY,
    subdomain: 'unknown',
    hostname,
    isProduction: true,
  };
}

/**
 * Get default subdomain for development
 * ONLY used in development environments (localhost, replit)
 * Can be overridden by environment variable
 */
function getDefaultDevSubdomain(): string {
  const defaultSubdomain = import.meta.env.VITE_DEFAULT_CITY_SUBDOMAIN || 'afogados';
  
  if (import.meta.env.DEV) {
    console.log(`[DEV] Using default subdomain: ${defaultSubdomain}`);
  }
  
  return defaultSubdomain;
}

/**
 * Check if current subdomain is reserved (platform subdomain, not city)
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

/**
 * Get user-friendly name for domain type
 */
export function getDomainTypeName(type: DomainType): string {
  switch (type) {
    case DomainType.ROOT:
      return 'Site Institucional';
    case DomainType.MASTER:
      return 'UrbanByte Control Center';
    case DomainType.COLLABORATOR:
      return 'Painel Colaborador';
    case DomainType.PARTNER:
      return 'Painel Parceiro';
    case DomainType.CITY:
      return 'Portal da Cidade';
    default:
      return 'Desconhecido';
  }
}
