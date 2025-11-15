import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlatformRole = "MASTER" | "TEAM" | "PARTNER" | null;

export interface PlatformUser {
  id: string;
  email: string;
  role: PlatformRole;
  full_name: string | null;
  created_at: string;
}

export const usePlatformUser = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ["platform-user"],
    queryFn: async () => {
      // Get currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Return unauthorized state if not authenticated (safe for public pages)
      if (!user?.email) {
        return {
          platformUser: null,
          role: null,
          isMaster: false,
          isTeam: false,
          isPartner: false,
          isPlatformUser: false,
        };
      }

      // Query platform_users table
      const { data, error } = await supabase
        .from("platform_users")
        .select("*")
        .eq("email", user.email)
        .single();

      // If user is not in platform_users table, return unauthorized state
      if (error || !data) {
        return {
          platformUser: null,
          role: null,
          isMaster: false,
          isTeam: false,
          isPartner: false,
          isPlatformUser: false,
        };
      }

      const platformUser = data as PlatformUser;

      return {
        platformUser,
        role: platformUser.role,
        isMaster: platformUser.role === "MASTER",
        isTeam: platformUser.role === "TEAM",
        isPartner: platformUser.role === "PARTNER",
        isPlatformUser: true,
      };
    },
    // Only enable query when explicitly allowed (after auth check)
    enabled,
    // Refresh every 5 minutes to catch role changes
    staleTime: 5 * 60 * 1000,
    // Prevent retry on auth errors
    retry: false,
  });
};
