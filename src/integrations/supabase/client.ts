/**
 * Supabase Client Barrel Export
 * 
 * Re-exports all context-specific Supabase clients.
 * 
 * ARCHITECTURE NOTE:
 * - Legacy code imports clients as objects (supabase, supabaseCitizen, etc)
 * - New auth code uses lazy getters (getCitizenClient, getMasterClient, etc)
 * - This prevents "Multiple GoTrueClient instances" warning by only loading
 *   the client for the current context.
 */

// Lazy getters (used by useAuthContext and auth pages)
export {
  getCitizenClient,
  getMasterClient,
  getCollaboratorClient,
  getPartnerClient,
  resetAllClients,
} from './lazy-clients';

// Direct clients (backward compatibility for legacy code)
export { supabase, supabaseCitizen } from './citizen';
export { supabaseMaster } from './master';
export { supabaseCollaborator } from './collaborator';
export { supabasePartner } from './partner';
