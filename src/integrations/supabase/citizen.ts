/**
 * Supabase Client for CITIZEN Portals (city.urbanbyte.com.br)
 * 
 * This client is dedicated to citizens accessing city-specific portals.
 * Sessions are isolated from master/collaborator/partner contexts.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hqhjbelcouanvcrqudbj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaGpiZWxjb3VhbnZjcnF1ZGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODA0MTIsImV4cCI6MjA3Njc1NjQxMn0.hTcp_XDyNBmd5cX48Vh14D750bwVRWHuORzhK3lONHY";

export const supabaseCitizen = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: 'supabase.citizen.auth',
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Backward compatibility: export as "supabase" for existing code
export const supabase = supabaseCitizen;