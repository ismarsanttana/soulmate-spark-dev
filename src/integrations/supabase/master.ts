/**
 * Supabase Client for MASTER Panel (dash.urbanbyte.com.br)
 * 
 * This client is dedicated to UrbanByte administrators.
 * Sessions are isolated from citizen/collaborator/partner contexts.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hqhjbelcouanvcrqudbj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaGpiZWxjb3VhbnZjcnF1ZGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODA0MTIsImV4cCI6MjA3Njc1NjQxMn0.hTcp_XDyNBmd5cX48Vh14D750bwVRWHuORzhK3lONHY";

export const supabaseMaster = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: 'supabase.master.auth',
    persistSession: true,
    autoRefreshToken: true,
  }
});
