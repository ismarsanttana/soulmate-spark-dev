import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { usePlatformUser } from "@/hooks/usePlatformUser";
import { validateRoleOrSignOut } from "@/lib/auth/platform-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

function withCurrentSearch(path: string) {
  if (path.includes("?") || path.startsWith("http") || typeof window === "undefined") {
    return path;
  }
  const currentSearch = window.location.search;
  if (!currentSearch) {
    return path;
  }
  return `${path}${currentSearch}`;
}

/**
 * MasterLoginPage
 *
 * Dedicated authentication screen for UrbanByte Control Center (MASTER domain).
 * Handles Supabase email/password auth and validates MASTER role before redirecting.
 */
export function MasterLoginPage() {
  const client = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info("[MasterLoginPage] mounted", {
        pathname: window.location.pathname,
        search: window.location.search,
      });
    }
  }, []);

  // Track existing session and react to auth state changes
  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await client.auth.getSession();
      if (!isMounted) return;
      setHasSession(!!data.session);
      setSessionChecked(true);
    };

    syncSession();

    const { data: authListener } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }
        setHasSession(!!session);
        setSessionChecked(true);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [client]);

  const {
    data: platformData,
    isLoading: isPlatformLoading,
  } = usePlatformUser(sessionChecked && hasSession);

  // Sign out sessions that don't belong to MASTER role
  useEffect(() => {
    if (!sessionChecked || !hasSession || isPlatformLoading || !platformData) {
      return;
    }

    if (!platformData.isMaster) {
      setErrorMessage("Você não tem permissão para acessar este painel.");
      client.auth
        .signOut()
        .catch((error) =>
          console.error("[MasterLoginPage] Failed to sign out:", error)
        );
    }
  }, [sessionChecked, hasSession, isPlatformLoading, platformData, client]);

  const isCheckingExistingAccess =
    !sessionChecked || (hasSession && isPlatformLoading);

  if (sessionChecked && hasSession && platformData?.isMaster) {
    return <Navigate to={withCurrentSearch("/")} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Login realizado com sucesso!");

      await validateRoleOrSignOut(
        client,
        "master",
        () => navigate(withCurrentSearch("/"), { replace: true }),
        () => {
          setErrorMessage(
            "Você não tem permissão para acessar este painel. Use uma conta MASTER."
          );
        }
      );
    } catch (error: any) {
      console.error("[MasterLoginPage] signIn error", error);
      setErrorMessage(
        error?.message || "Não foi possível fazer login. Tente novamente."
      );
      toast.error("Erro ao fazer login", {
        description:
          error?.message || "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingExistingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Preparando seu acesso ao UrbanByte Control Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full shadow-xl border border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">UrbanByte Control Center</CardTitle>
            <CardDescription>
              Acesse o painel MASTER da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="master-email">E-mail corporativo</Label>
                <Input
                  id="master-email"
                  type="email"
                  placeholder="admin@urbanbyte.com.br"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="master-password">Senha</Label>
                <Input
                  id="master-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive text-center" role="alert">
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="master-login-button"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MasterLoginPage;
