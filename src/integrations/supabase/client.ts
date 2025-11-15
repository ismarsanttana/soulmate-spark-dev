/**
 * Supabase Client Barrel Export
 * 
 * Re-exports all context-specific Supabase clients.
 * 
 * ARCHITECTURE NOTE:
 * - NEW CODE: Use lazy getters (getCitizenClient, getMasterClient, etc)
 * - LEGACY CODE: Direct clients (supabase, supabaseCitizen, etc) still work
 *   but are DEPRECATED due to "Multiple GoTrueClient instances" warning
 * 
 * MIGRATION PATH:
 * Replace:
 *   import { supabase } from '@/integrations/supabase/client';
 *   await supabase.from('table')...
 * 
 * With:
 *   import { getCitizenClient } from '@/integrations/supabase/client';
 *   const client = getCitizenClient();
 *   await client.from('table')...
 */

// ✅ RECOMMENDED: Lazy getters (prevents multiple GoTrueClient instances)
export {
  getCitizenClient,
  getMasterClient,
  getCollaboratorClient,
  getPartnerClient,
  resetAllClients,
} from './lazy-clients';

// ⚠️ DEPRECATED: Direct clients (backward compatibility only)
// These cause "Multiple GoTrueClient instances" warning when imported together
// Migrate to lazy getters above
/**
 * @deprecated Use getCitizenClient() instead to avoid multiple GoTrueClient instances
 */
export { supabase, supabaseCitizen } from './citizen';
/**
 * @deprecated Use getMasterClient() instead to avoid multiple GoTrueClient instances
 */
export { supabaseMaster } from './master';
/**
 * @deprecated Use getCollaboratorClient() instead to avoid multiple GoTrueClient instances
 */
export { supabaseCollaborator } from './collaborator';
/**
 * @deprecated Use getPartnerClient() instead to avoid multiple GoTrueClient instances
 */
export { supabasePartner } from './partner';
