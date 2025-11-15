/**
 * Lazy Supabase Client Initialization
 * 
 * Creates Supabase clients on-demand to avoid "Multiple GoTrueClient instances" warning.
 * Each client is memoized and only created when first accessed.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Memoized client instances
let citizenClient: SupabaseClient | null = null;
let masterClient: SupabaseClient | null = null;
let collaboratorClient: SupabaseClient | null = null;
let partnerClient: SupabaseClient | null = null;

/**
 * Get or create Citizen portal client (default)
 * Storage key: sb-{project}-auth-token
 */
export function getCitizenClient(): SupabaseClient {
  if (!citizenClient) {
    console.log('[Supabase] Initializing CITIZEN client');
    citizenClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return citizenClient;
}

/**
 * Get or create Master admin panel client
 * Storage key: sb-{project}-auth-token-master
 */
export function getMasterClient(): SupabaseClient {
  if (!masterClient) {
    console.log('[Supabase] Initializing MASTER client');
    masterClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storageKey: 'sb-hqhjbelcouanvcrqudbj-auth-token-master',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return masterClient;
}

/**
 * Get or create Collaborator panel client
 * Storage key: sb-{project}-auth-token-collaborator
 */
export function getCollaboratorClient(): SupabaseClient {
  if (!collaboratorClient) {
    console.log('[Supabase] Initializing COLLABORATOR client');
    collaboratorClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storageKey: 'sb-hqhjbelcouanvcrqudbj-auth-token-collaborator',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return collaboratorClient;
}

/**
 * Get or create Partner panel client
 * Storage key: sb-{project}-auth-token-partner
 */
export function getPartnerClient(): SupabaseClient {
  if (!partnerClient) {
    console.log('[Supabase] Initializing PARTNER client');
    partnerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storageKey: 'sb-hqhjbelcouanvcrqudbj-auth-token-partner',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return partnerClient;
}

/**
 * Reset all client instances (useful for testing)
 */
export function resetAllClients(): void {
  citizenClient = null;
  masterClient = null;
  collaboratorClient = null;
  partnerClient = null;
  console.log('[Supabase] All clients reset');
}
