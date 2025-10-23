import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "prefeito" | "secretario";

export const useUserRole = () => {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { roles: [], isAdmin: false, isPrefeito: false, isSecretario: false };
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;

      const roles = data?.map(r => r.role as UserRole) || [];

      return {
        roles,
        isAdmin: roles.includes("admin"),
        isPrefeito: roles.includes("prefeito"),
        isSecretario: roles.includes("secretario"),
      };
    },
  });
};
