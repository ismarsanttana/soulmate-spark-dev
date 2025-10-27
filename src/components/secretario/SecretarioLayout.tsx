import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SecretarioSidebar } from "./SecretarioSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

interface SecretarioLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SecretarioLayout({ children, activeTab, onTabChange }: SecretarioLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determina qual secretaria buscar baseado na rota
  const getSecretariaSlug = () => {
    const path = location.pathname;
    if (path === "/ascom") return "comunicacao";
    if (path === "/edu") return "educacao";
    return "comunicacao"; // default
  };
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };
  
  const { data: secretariaName } = useQuery({
    queryKey: ["secretary-assignment-layout", getSecretariaSlug()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "Secretaria de Comunicação";

      const targetSlug = getSecretariaSlug();

      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .eq("secretaria_slug", targetSlug)
        .maybeSingle();

      if (!assignment) return "Secretaria de Comunicação";

      const { data: secretaria } = await supabase
        .from("secretarias")
        .select("name")
        .eq("slug", assignment.secretaria_slug)
        .single();

      return secretaria?.name || "Secretaria de Comunicação";
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SecretarioSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold flex-1">Painel da {secretariaName || "Secretaria de Comunicação"}</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
