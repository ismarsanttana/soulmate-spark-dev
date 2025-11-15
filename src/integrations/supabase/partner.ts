/**
 * Supabase Client for PARTNER Panel (parceiro.urbanbyte.com.br)
 * 
 * This client is dedicated to external partners.
 * Sessions are isolated from citizen/master/collaborator contexts.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hqhjbelcouanvcrqudbj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaGpiZWxjb3VhbnZjcnF1ZGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODA0MTIsImV4cCI6MjA3Njc1NjQxMn0.hTcp_XDyNBmd5cX48Vh14D750bwVRWHuORzhK3lONHY";

export const supabasePartner = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: 'supabase.partner.auth',
    persistSession: true,
    autoRefreshToken: true,
  }
});
