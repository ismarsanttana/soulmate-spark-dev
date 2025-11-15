/**
 * Supabase Client Barrel Export
 * 
 * Re-exports all context-specific Supabase clients.
 * For backward compatibility, the default export is the citizen client.
 */
export { supabase, supabaseCitizen } from './citizen';
export { supabaseMaster } from './master';
export { supabaseCollaborator } from './collaborator';
export { supabasePartner } from './partner';
