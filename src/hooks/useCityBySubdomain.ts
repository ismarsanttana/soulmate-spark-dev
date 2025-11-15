/**
 * useCityBySubdomain Hook
 * 
 * Resolves city information from subdomain.
 * Queries the cities table in Supabase (Control Plane) by subdomain field.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * City data structure (from cities table)
 */
export interface City {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  db_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Map subdomain to slug for fallback when subdomain column doesn't exist yet
 * TODO: Remove this after adding subdomain column to Supabase Control Plane
 */
function subdomainToSlug(subdomain: string): string {
  const mapping: Record<string, string> = {
    'afogados': 'afogados-da-ingazeira',
    'zabele': 'zabele',
  };
  return mapping[subdomain] || subdomain;
}

/**
 * Hook to fetch city data by subdomain
 * 
 * FALLBACK STRATEGY:
 * 1. Try to fetch by subdomain column (future-proof)
 * 2. If subdomain column doesn't exist (error 42703), fallback to slug
 */
export function useCityBySubdomain(
  subdomain: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['city', 'subdomain', subdomain],
    queryFn: async () => {
      if (!subdomain) {
        throw new Error('Subdomain is required');
      }

      // Try to fetch by subdomain first (when column exists)
      let { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      // If subdomain column doesn't exist, fallback to slug
      if (error && error.code === '42703') {
        console.log(`[useCityBySubdomain] Column 'subdomain' not found, using slug fallback for: ${subdomain}`);
        const slug = subdomainToSlug(subdomain);
        
        const fallbackResult = await supabase
          .from('cities')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error fetching city by subdomain:', error);
        throw new Error('City not found: ' + subdomain);
      }

      if (!data) {
        throw new Error('City not found: ' + subdomain);
      }

      return data as City;
    },
    enabled: options?.enabled !== false && !!subdomain,
    staleTime: 5 * 60 * 1000, // 5 minutes - cities don't change often
    retry: 2,
  });
}

/**
 * Hook to check if a subdomain exists
 * Useful for validation without fetching full city data
 */
export function useSubdomainExists(subdomain: string | null | undefined) {
  return useQuery({
    queryKey: ['city', 'exists', subdomain],
    queryFn: async () => {
      if (!subdomain) {
        return false;
      }

      const { count, error } = await supabase
        .from('cities')
        .select('id', { count: 'exact', head: true })
        .eq('subdomain', subdomain)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking subdomain existence:', error);
        return false;
      }

      return (count ?? 0) > 0;
    },
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get all active cities
 * Useful for master dashboard, partner panels, etc.
 */
export function useAllCities(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['cities', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching all cities:', error);
        throw error;
      }

      return (data || []) as City[];
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}
