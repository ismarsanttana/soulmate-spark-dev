import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "./useAuthContext";

// Use lowercase to match database schema
export type PlatformRole = "master" | "team" | "partner" | null;

export interface PlatformUser {
  id: string;
  user_id: string;
  role: PlatformRole;
  is_active: boolean;
  created_at: string;
}

export const usePlatformUser = (enabled: boolean = false) => {
  const client = useAuthContext();
  
  return useQuery({
    queryKey: ["platform-user"],
    queryFn: async () => {
      // Get currently authenticated user
      const { data: { user } } = await client.auth.getUser();
      
      // Return unauthorized state if not authenticated (safe for public pages)
      if (!user?.id) {
        return {
          platformUser: null,
          role: null,
          isMaster: false,
          isTeam: false,
          isPartner: false,
          isPlatformUser: false,
        };
      }

      // Query platform_users table using user_id (not email)
      const { data, error } = await client
        .from("platform_users")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      // If user is not in platform_users table or not active, return unauthorized state
      if (error || !data) {
        console.log('[usePlatformUser] User not found in platform_users or not active');
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
        isMaster: platformUser.role === "master",
        isTeam: platformUser.role === "team",
        isPartner: platformUser.role === "partner",
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
