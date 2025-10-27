import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SecretarioSidebar } from "./SecretarioSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Building2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";

interface SecretarioLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SecretarioLayout({ children, activeTab, onTabChange }: SecretarioLayoutProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

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

  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Topbar */}
      <header className="ascom-topbar sticky top-0 z-50 text-white">
        <div className="max-w-[1440px] mx-auto h-16 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {appSettings?.logo_url ? (
              <img 
                src={appSettings.logo_url} 
                alt="Logo" 
                className="h-10 w-10 object-contain"
              />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
            <span className="text-lg font-extrabold tracking-tight">
              {appSettings?.app_name || "Prefeitura Municipal"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white"
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 h-9 rounded-xl bg-white/8 hover:bg-white/15 border border-white/25 text-white font-semibold"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-[1440px] mx-auto w-full gap-4 p-5">
        <SecretarioSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
