/**
 * useDomainContext Hook
 * 
 * React hook to access the current domain context.
 * Detects which "mode" the app is running in based on hostname/subdomain.
 */

import { useMemo } from 'react';
import { getDomainContext } from '@/core/domain-context';
import type { DomainContext } from '@/core/domain-types';

/**
 * Hook to get current domain context
 * 
 * @returns DomainContext object with type, subdomain, hostname, and isProduction
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const context = useDomainContext();
 *   
 *   if (context.type === DomainType.CITY) {
 *     return <CityPortal subdomain={context.subdomain} />;
 *   }
 *   
 *   if (context.type === DomainType.MASTER) {
 *     return <MasterDashboard />;
 *   }
 *   
 *   // ... etc
 * }
 * ```
 */
export function useDomainContext(): DomainContext {
  // Memoize to avoid recalculating on every render
  // Note: hostname doesn't change during app lifecycle, so this is safe
  const context = useMemo(() => getDomainContext(), []);

  return context;
}

/**
 * Hook to check if current domain is a city portal
 */
export function useIsCityDomain(): boolean {
  const context = useDomainContext();
  return context.type === 'city';
}

/**
 * Hook to check if current domain is the master panel
 */
export function useIsMasterDomain(): boolean {
  const context = useDomainContext();
  return context.type === 'master';
}

/**
 * Hook to check if current domain is the collaborator panel
 */
export function useIsCollaboratorDomain(): boolean {
  const context = useDomainContext();
  return context.type === 'collaborator';
}

/**
 * Hook to check if current domain is the partner panel
 */
export function useIsPartnerDomain(): boolean {
  const context = useDomainContext();
  return context.type === 'partner';
}

/**
 * Hook to check if current domain is the root/marketing site
 */
export function useIsRootDomain(): boolean {
  const context = useDomainContext();
  return context.type === 'root';
}
