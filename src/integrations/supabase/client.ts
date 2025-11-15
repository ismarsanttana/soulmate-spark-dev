/**
 * Supabase Client Barrel Export
 * 
 * Re-exports all lazy-loaded Supabase clients.
 * For backward compatibility, exports getter functions that return memoized instances.
 * 
 * NOTE: Clients are now lazy-loaded to prevent "Multiple GoTrueClient instances" warning.
 * Legacy code can still use these exports, but new code should use lazy-clients directly.
 */
export {
  getCitizenClient,
  getMasterClient,
  getCollaboratorClient,
  getPartnerClient,
  resetAllClients,
} from './lazy-clients';

// Backward compatibility: Default export
export const supabase = getCitizenClient;
export const supabaseCitizen = getCitizenClient;
export const supabaseMaster = getMasterClient;
export const supabaseCollaborator = getCollaboratorClient;
export const supabasePartner = getPartnerClient;
