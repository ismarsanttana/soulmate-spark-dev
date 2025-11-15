import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatformUser } from "@/hooks/usePlatformUser";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function withCurrentSearch(path: string) {
  if (path.startsWith("http") || path.includes("?") || typeof window === "undefined") {
    return path;
  }
  const currentSearch = window.location.search;
  if (!currentSearch) {
    return path;
  }
  return `${path}${currentSearch}`;
}

interface ProtectedMasterRouteProps {
  children: ReactNode;
}

export function ProtectedMasterRoute({ children }: ProtectedMasterRouteProps) {
  const navigate = useNavigate();
  const client = useAuthContext();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Ensure Supabase session is valid before checking platform role
  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await client.auth.getSession();
      if (!isMounted) return;
      const hasSession = !!data.session;
      setIsAuthenticated(hasSession);
      setIsAuthChecked(true);

      if (!hasSession) {
        navigate(withCurrentSearch("/auth"), { replace: true });
      }
    };

    syncSession();

    const { data: authListener } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }

        const hasSession = !!session;
        setIsAuthenticated(hasSession);
        setIsAuthChecked(true);

        if (!hasSession) {
          navigate(withCurrentSearch("/auth"), { replace: true });
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [client, navigate]);

  // Only query platform_users AFTER auth is confirmed
  const {
    data: platformData,
    isLoading: isPlatformLoading,
    error,
  } = usePlatformUser(isAuthenticated);

  // Loading state - checking auth first, then platform access
  if (!isAuthChecked || (isAuthenticated && isPlatformLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated (should redirect, but show fallback)
  if (!isAuthenticated) {
    return null;
  }

  // Not authorized or error - show access denied
  if (!platformData?.isMaster || error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-destructive/10">
                <ShieldAlert className="w-12 h-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Você não tem permissão para acessar o <strong>UrbanByte Control Center</strong>.
              Esta área é restrita a usuários com privilégios de Superadmin.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => navigate(withCurrentSearch("/"))}
                variant="default"
                className="w-full"
                data-testid="button-go-home"
              >
                Voltar para Início
              </Button>
              <Button
                onClick={() => {
                  client.auth.signOut();
                  navigate(withCurrentSearch("/auth"));
                }}
                variant="outline"
                className="w-full"
                data-testid="button-logout"
              >
                Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized - render protected content
  return <>{children}</>;
}
