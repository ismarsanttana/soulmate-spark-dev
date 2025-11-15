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

export const usePlatformUser = () => {
  return useQuery({
    queryKey: ["platform-user"],
    queryFn: async () => {
      // Get currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
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
    // Refresh every 5 minutes to catch role changes
    staleTime: 5 * 60 * 1000,
  });
};
