import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseCollaborator } from "@/integrations/supabase/collaborator";
import { validateRoleOrSignOut } from "@/lib/auth/platform-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users } from "lucide-react";

/**
 * AuthCollaborator - Login Page for Collaborator Panel
 * 
 * URL: colaborador.urbanbyte.com.br/auth
 * Context: COLLABORATOR
 * Users: Municipality collaborators (secretários, etc)
 */
export default function AuthCollaborator() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabaseCollaborator.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      
      // Validate user has 'team' role in platform_users table
      await validateRoleOrSignOut(
        supabaseCollaborator,
        'team',
        () => navigate("/dashboard", { replace: true }), // onSuccess
        () => navigate("/auth", { replace: true })       // onFailure
      );
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-panel-name">
              Painel de Colaboradores
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesso para equipe municipal
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl"
                data-testid="input-email"
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
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl"
              data-testid="button-login"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
