import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "wouter";
import { supabaseCitizen } from "@/integrations/supabase/citizen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCityTheme } from "@/hooks/useCityTheme";

/**
 * AuthCitizen - Login Page for City Portals
 * 
 * URL: {city}.urbanbyte.com.br/auth
 * Context: CITY
 * Users: Citizens of the specific municipality
 */
export default function AuthCitizen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useNavigate();
  const [location] = useLocation();
  
  const { data: cityTheme } = useCityTheme();
  
  // Captura a URL de origem via query params ou sessionStorage
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('redirect');
  
  // Salva o redirect no sessionStorage se existir
  useEffect(() => {
    if (redirectParam) {
      sessionStorage.setItem('auth_redirect', redirectParam);
      console.log('[AUTH] Salvando redirect no sessionStorage:', redirectParam);
    }
  }, [redirectParam]);
  
  const from = redirectParam || sessionStorage.getItem('auth_redirect') || null;
  
  console.log('[AUTH] Redirect param:', redirectParam);
  console.log('[AUTH] From:', from);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabaseCitizen.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast.success("Login realizado com sucesso!");
        
        // Busca roles PRIMEIRO antes de qualquer redirecionamento
        const { data: roles } = await supabaseCitizen
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        console.log('[AUTH] User roles:', roles?.map(r => r.role));

        // Recupera o redirect do sessionStorage
        const savedRedirect = sessionStorage.getItem('auth_redirect');
        console.log('[AUTH] Saved redirect:', savedRedirect);
        sessionStorage.removeItem('auth_redirect');

        // Se é prefeito e tem redirect para painel de prefeito, redireciona direto
        if (roles?.some(r => r.role === "prefeito") && 
            savedRedirect && savedRedirect.includes('/prefeito')) {
          console.log('[AUTH] Prefeito login - redirecting to:', savedRedirect);
          await new Promise(resolve => setTimeout(resolve, 300));
          navigate(savedRedirect, { replace: true });
          return;
        }

        // Se é secretário e tem redirect para painel de secretário, redireciona direto
        if (roles?.some(r => r.role === "secretario") && savedRedirect) {
          if (savedRedirect.includes('/edu') || 
              savedRedirect.includes('/ascom') || 
              savedRedirect.includes('/secretario')) {
            console.log('[AUTH] Secretário login - redirecting to:', savedRedirect);
            await new Promise(resolve => setTimeout(resolve, 300));
            navigate(savedRedirect, { replace: true });
            return;
          }
        }

        // Se é professor e tem redirect para painel de professor, redireciona direto
        if (roles?.some(r => r.role === "professor") && 
            savedRedirect && savedRedirect.includes('/professor')) {
          console.log('[AUTH] Professor login - redirecting to:', savedRedirect);
          await new Promise(resolve => setTimeout(resolve, 300));
          navigate(savedRedirect, { replace: true });
          return;
        }

        // Se veio de uma página protegida genérica
        if (savedRedirect && savedRedirect !== "/auth") {
          console.log('[AUTH] Generic redirect to:', savedRedirect);
          await new Promise(resolve => setTimeout(resolve, 300));
          navigate(savedRedirect, { replace: true });
          return;
        }
        
        console.log('[AUTH] No saved redirect, using role-based routing...');
        
        // Caso contrário, verifica roles e redireciona para o painel apropriado
        if (data.user && roles && roles.length > 0) {
          // Verifica se é admin
          if (roles.some(r => r.role === "admin")) {
            console.log('[AUTH] Redirecting admin to /admin');
            navigate("/admin", { replace: true });
            return;
          }
          
          // Verifica se é prefeito
          if (roles.some(r => r.role === "prefeito")) {
            navigate("/painel-prefeito", { replace: true });
            return;
          }

          // Verifica se é secretário e redireciona baseado na secretaria
          if (roles.some(r => r.role === "secretario")) {
            const { data: assignments } = await supabaseCitizen
              .from("secretary_assignments")
              .select("secretaria_slug")
              .eq("user_id", data.user.id);

            // Se tem múltiplas atribuições, prioriza educação, depois comunicação
            if (assignments && assignments.length > 0) {
              const hasEducacao = assignments.some(a => a.secretaria_slug === "educacao");
              const hasComunicacao = assignments.some(a => a.secretaria_slug === "comunicacao");
              
              if (hasEducacao) {
                navigate("/edu", { replace: true });
                return;
              } else if (hasComunicacao) {
                navigate("/ascom", { replace: true });
                return;
              }
            }
            
            // Fallback para painel genérico
            navigate("/painel-secretario", { replace: true });
            return;
          }

          // Verifica outros roles
          if (roles.some(r => r.role === "professor")) {
            console.log('[AUTH] Redirecting professor to /edu/professor');
            navigate("/edu/professor", { replace: true });
            return;
          }
          if (roles.some(r => r.role === "aluno")) {
            navigate("/painel-aluno", { replace: true });
            return;
          }
          if (roles.some(r => r.role === "pai")) {
            navigate("/painel-pais", { replace: true });
            return;
          }
        }
        
        navigate("/");
      } else {
        const { error } = await supabaseCitizen.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Verifique seu email.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            {cityTheme?.logo_url && (
              <img
                src={cityTheme.logo_url}
                alt={`Prefeitura de ${cityTheme.name}`}
                className="h-16 w-auto mx-auto mb-4 bg-white p-2 rounded-lg"
                data-testid="img-city-logo"
              />
            )}
            <h1 className="text-2xl font-bold" data-testid="text-city-name">
              Conecta {cityTheme?.name || "Afogados"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Nome completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="rounded-xl"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading
                ? "Processando..."
                : isLogin
                ? "Entrar"
                : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Entre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
