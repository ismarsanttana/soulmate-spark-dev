import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { data: roleData, isLoading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      if (!isLoading && roleData) {
        const hasAccess = allowedRoles.some(role => roleData.roles.includes(role));
        
        if (!hasAccess) {
          navigate("/");
        }
      }
    };

    checkAuth();
  }, [navigate, isLoading, roleData, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
