/**
 * Domain Access Guards
 * 
 * Controls access to different domains based on user roles.
 * Prevents unauthorized access to platform domains (dash, colaborador, parceiro).
 */

import { DomainType, type DomainContext, type DomainAccessResult } from '@/core/domain-types';
import type { PlatformRole } from '@/hooks/usePlatformUser';

/**
 * Check if a user can access a specific domain
 * 
 * Access Rules:
 * - MASTER: Can access dash.* (and optionally colaborador.*, parceiro.*)
 * - TEAM: Can access colaborador.*
 * - PARTNER: Can access parceiro.*
 * - City users: Can only access city domains (via city-specific auth)
 * 
 * @param userRole - User's platform role (from platform_users table)
 * @param domainType - The domain type being accessed
 * @returns Access result with allowed flag and optional redirect
 */
export function canAccessDomain(
  userRole: PlatformRole | null,
  domainType: DomainType
): DomainAccessResult {
  // ROOT (marketing site) is publicly accessible
  if (domainType === DomainType.ROOT) {
    return { allowed: true };
  }

  // CITY domains - authentication handled separately by city context
  // Here we just check that it's not a platform user trying to access
  if (domainType === DomainType.CITY) {
    // Platform users (master, team, partner) should not access city domains
    // They have their own dedicated panels
    if (userRole && ["master", "team", "partner"].includes(userRole)) {
      return {
        allowed: false,
        reason: 'Platform users should use their dedicated panels',
        redirectTo: getPlatformDashboardUrl(userRole),
      };
    }
    
    // City users or unauthenticated users can access
    return { allowed: true };
  }

  // MASTER domain (dash.urbanbyte.com.br) - only master role
  if (domainType === DomainType.MASTER) {
    if (userRole === "master") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only MASTER users can access UrbanByte Control Center',
      redirectTo: '/auth',
    };
  }

  // COLLABORATOR domain (colaborador.urbanbyte.com.br) - team or master
  if (domainType === DomainType.COLLABORATOR) {
    if (userRole === "team" || userRole === "master") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only TEAM members can access Collaborator Panel',
      redirectTo: '/auth',
    };
  }

  // PARTNER domain (parceiro.urbanbyte.com.br) - partner or master
  if (domainType === DomainType.PARTNER) {
    if (userRole === "partner" || userRole === "master") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only PARTNER users can access Partner Panel',
      redirectTo: '/auth',
    };
  }

  // Fallback - deny by default
  return {
    allowed: false,
    reason: 'Unknown domain type',
  };
}

/**
 * Get platform dashboard URL for a given role
 * Used for redirecting platform users away from city domains
 */
function getPlatformDashboardUrl(role: PlatformRole): string {
  switch (role) {
    case "master":
      return getDashboardUrl(DomainType.MASTER);
    case "team":
      return getDashboardUrl(DomainType.COLLABORATOR);
    case "partner":
      return getDashboardUrl(DomainType.PARTNER);
    default:
      return '/auth';
  }
}

/**
 * Get full URL for a dashboard domain
 * Handles both dev mode (query params) and production (subdomains)
 */
export function getDashboardUrl(domainType: DomainType): string {
  const hostname = window.location.hostname;
  
  // In production with real domains
  if (hostname.includes('urbanbyte.com.br')) {
    switch (domainType) {
      case DomainType.MASTER:
        return 'https://dash.urbanbyte.com.br';
      case DomainType.COLLABORATOR:
        return 'https://colaborador.urbanbyte.com.br';
      case DomainType.PARTNER:
        return 'https://parceiro.urbanbyte.com.br';
      case DomainType.ROOT:
        return 'https://urbanbyte.com.br';
      default:
        return '/';
    }
  }

  // In development with query params
  const origin = window.location.origin;
  switch (domainType) {
    case DomainType.MASTER:
      return `${origin}/?mode=dash`;
    case DomainType.COLLABORATOR:
      return `${origin}/?mode=colaborador`;
    case DomainType.PARTNER:
      return `${origin}/?mode=parceiro`;
    case DomainType.ROOT:
      return `${origin}/?mode=root`;
    default:
      return origin;
  }
}

/**
 * Validate if current domain context is accessible by user
 * Combines domain detection with access check
 * 
 * @param context - Current domain context
 * @param userRole - User's platform role
 * @returns Access result
 */
export function validateDomainAccess(
  context: DomainContext,
  userRole: PlatformRole | null
): DomainAccessResult {
  return canAccessDomain(userRole, context.type);
}

/**
 * Check if user is a platform user (master, team, or partner)
 */
export function isPlatformUser(userRole: PlatformRole | null): boolean {
  return userRole !== null && ["master", "team", "partner"].includes(userRole);
}

/**
 * Check if user has master privileges
 */
export function isMasterUser(userRole: PlatformRole | null): boolean {
  return userRole === "master";
}

/**
 * Get user-friendly domain access denial message
 */
export function getAccessDenialMessage(domainType: DomainType): string {
  switch (domainType) {
    case DomainType.MASTER:
      return 'Acesso restrito ao UrbanByte Control Center. Apenas administradores master podem acessar.';
    case DomainType.COLLABORATOR:
      return 'Acesso restrito ao Painel do Colaborador. Apenas membros da equipe podem acessar.';
    case DomainType.PARTNER:
      return 'Acesso restrito ao Painel do Parceiro. Apenas parceiros credenciados podem acessar.';
    case DomainType.CITY:
      return 'Esta é uma área restrita para usuários da cidade. Usuários da plataforma devem usar seus painéis dedicados.';
    default:
      return 'Você não tem permissão para acessar esta área.';
  }
}
