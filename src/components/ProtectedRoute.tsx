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
      console.log('[PROTECTED ROUTE] Checking auth...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redireciona para auth passando a página atual como parâmetro
        const redirectUrl = `/auth?redirect=${encodeURIComponent(location.pathname)}`;
        console.log('[PROTECTED ROUTE] No user, redirecting to:', redirectUrl);
        navigate(redirectUrl, { replace: true });
        return;
      }

      console.log('[PROTECTED ROUTE] User found:', user.id, 'Loading:', isLoading);

      if (!isLoading && roleData) {
        console.log('[PROTECTED ROUTE] Role data:', roleData.roles);
        const hasAccess = allowedRoles.some(role => roleData.roles.includes(role));
        
        if (!hasAccess) {
          console.log('[PROTECTED ROUTE] No access, redirecting to /');
          navigate("/", { replace: true });
        } else {
          console.log('[PROTECTED ROUTE] Access granted!');
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
