import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { EducacaoSidebar } from "./EducacaoSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Building2, Moon, Sun, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";

interface EducacaoLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function EducacaoLayout({ children, activeTab, onTabChange }: EducacaoLayoutProps) {
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

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-educacao"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return profile;
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
            {appSettings?.icon_url ? (
              <img 
                src={appSettings.icon_url} 
                alt="Ícone do App" 
                className="h-12 w-12 object-contain rounded-lg p-1"
                style={{
                  backgroundColor: appSettings.logo_background_color || "transparent",
                }}
              />
            ) : (
              <Building2 className="h-8 w-8" />
            )}
            <span className="text-lg font-extrabold tracking-tight">
              {appSettings?.app_name || "Prefeitura Municipal"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-auto py-2 px-3 hover:bg-white/10 rounded-xl"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarImage src={userProfile?.avatar_url || ""} alt={userProfile?.full_name || ""} />
                    <AvatarFallback className="bg-white/10 text-white text-sm font-semibold">
                      {userProfile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "SE"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-white leading-tight">
                      {userProfile?.full_name || "Usuário"}
                    </span>
                    <span className="text-xs text-white/70 leading-tight">
                      Secretaria de Educação
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTabChange("perfil")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações de Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white"
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-[1440px] mx-auto w-full gap-4 p-5">
        <EducacaoSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
