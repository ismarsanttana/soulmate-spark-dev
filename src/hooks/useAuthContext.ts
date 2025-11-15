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
import { useLocation } from 'wouter';
import { getDomainContext } from '@/core/domain-context';
import { DomainType } from '@/core/domain-types';
import { supabaseCitizen } from '@/integrations/supabase/citizen';
import { supabaseMaster } from '@/integrations/supabase/master';
import { supabaseCollaborator } from '@/integrations/supabase/collaborator';
import { supabasePartner } from '@/integrations/supabase/partner';

export function useAuthContext() {
  const location = useLocation();
  
  // Detect domain context (reactive to query params in dev)
  const context = useMemo(() => {
    return getDomainContext();
  }, [location.search]);

  // Return appropriate Supabase client
  switch (context.type) {
    case DomainType.MASTER:
      return supabaseMaster;
    
    case DomainType.COLLABORATOR:
      return supabaseCollaborator;
    
    case DomainType.PARTNER:
      return supabasePartner;
    
    case DomainType.CITY:
    case DomainType.ROOT:
    default:
      return supabaseCitizen;
  }
}
