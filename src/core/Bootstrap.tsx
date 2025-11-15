/**
 * Bootstrap Component
 * 
 * Entry point that detects domain context and renders the appropriate AppShell.
 * This is the root component that determines which version of the app to load.
 */

import { getDomainContext, getDomainTypeName } from './domain-context';
import { DomainType } from './domain-types';
import { MasterAppShell } from '@/shells/MasterAppShell';
import { CityAppShell } from '@/shells/CityAppShell';
import { CollaboratorShell } from '@/shells/CollaboratorShell';
import { PartnerShell } from '@/shells/PartnerShell';
import { RootShell } from '@/shells/RootShell';

/**
 * Bootstrap Component
 * 
 * Detects the current domain context and renders the appropriate app shell:
 * - ROOT → Marketing/institutional website
 * - MASTER → UrbanByte Control Center (dash.urbanbyte.com.br)
 * - COLLABORATOR → Team panel (colaborador.urbanbyte.com.br)
 * - PARTNER → Partner panel (parceiro.urbanbyte.com.br)
 * - CITY → City-specific portal ({city}.urbanbyte.com.br)
 */
export function Bootstrap() {
  // Detect domain context
  const context = getDomainContext();

  // Log context in development
  if (import.meta.env.DEV) {
    console.log('[Bootstrap] Domain Context:', {
      type: context.type,
      typeName: getDomainTypeName(context.type),
      subdomain: context.subdomain,
      hostname: context.hostname,
      isProduction: context.isProduction,
    });
  }

  // Render appropriate AppShell based on context
  switch (context.type) {
    case DomainType.ROOT:
      return <RootShell />;

    case DomainType.MASTER:
      return <MasterAppShell />;

    case DomainType.COLLABORATOR:
      return <CollaboratorShell />;

    case DomainType.PARTNER:
      return <PartnerShell />;

    case DomainType.CITY:
      // City context - pass subdomain to CityAppShell
      if (!context.subdomain) {
        console.error('[Bootstrap] CITY context but no subdomain found');
        return <div>Error: Invalid city context</div>;
      }
      return <CityAppShell subdomain={context.subdomain} />;

    default:
      // Fallback - should never happen
      console.error('[Bootstrap] Unknown domain type:', context.type);
      return <div>Error: Unknown domain type</div>;
  }
}
