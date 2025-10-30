import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Captura a URL de origem via query params ou state
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam || (location.state as any)?.from?.pathname || null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast.success("Login realizado com sucesso!");
        
        // Se veio de uma página protegida, redireciona de volta
        if (from && from !== "/auth") {
          navigate(from, { replace: true });
          return;
        }
        
        // Caso contrário, verifica roles e redireciona para o painel apropriado
        if (data.user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);

          if (roles && roles.length > 0) {
            // Verifica se é admin
            if (roles.some(r => r.role === "admin")) {
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
              const { data: assignments } = await supabase
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
        }
        
        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
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
            <img
              src="https://afogadosdaingazeira.pe.gov.br/img/logo_afogados.png"
              alt="Prefeitura de Afogados da Ingazeira"
              className="h-16 w-auto mx-auto mb-4 bg-white p-2 rounded-lg"
            />
            <h1 className="text-2xl font-bold">Conecta Afogados</h1>
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
};

export default Auth;
