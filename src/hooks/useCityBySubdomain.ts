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
 * Hook to fetch city data by subdomain
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

      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

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
