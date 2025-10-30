import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: roleData, isLoading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redireciona para auth passando a página atual como parâmetro
        const redirectUrl = `/auth?redirect=${encodeURIComponent(location.pathname)}`;
        console.log('[PROTECTED ROUTE] No user, redirecting to:', redirectUrl);
        navigate(redirectUrl, { replace: true });
        return;
      }

      if (!isLoading && roleData) {
        const hasAccess = allowedRoles.some(role => roleData.roles.includes(role));
        
        if (!hasAccess) {
          navigate("/", { replace: true });
        }
      }
    };

    checkAuth();
  }, [navigate, location, isLoading, roleData, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
