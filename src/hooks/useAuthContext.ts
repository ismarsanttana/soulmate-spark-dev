/**
 * useAuthContext Hook
 * 
 * Returns the appropriate Supabase client based on the current domain context.
 * This ensures authentication sessions are isolated between:
 * - MASTER (dash.urbanbyte.com.br) → supabaseMaster
 * - COLLABORATOR (colaborador.urbanbyte.com.br) → supabaseCollaborator
 * - PARTNER (parceiro.urbanbyte.com.br) → supabasePartner
 * - CITY ({city}.urbanbyte.com.br) → supabaseCitizen
 */
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getDomainContext } from '@/core/domain-context';
import { DomainType } from '@/core/domain-types';
import {
  getCitizenClient,
  getMasterClient,
  getCollaboratorClient,
  getPartnerClient,
} from '@/integrations/supabase/lazy-clients';

export function useAuthContext() {
  const location = useLocation();
  
  // Detect domain context (reactive to query params in dev)
  const context = useMemo(() => {
    return getDomainContext();
  }, [location]);

  // Return appropriate Supabase client (lazy-loaded)
  switch (context.type) {
    case DomainType.MASTER:
      return getMasterClient();
    
    case DomainType.COLLABORATOR:
      return getCollaboratorClient();
    
    case DomainType.PARTNER:
      return getPartnerClient();
    
    case DomainType.CITY:
    case DomainType.ROOT:
    default:
      return getCitizenClient();
  }
}
