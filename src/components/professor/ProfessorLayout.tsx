import { useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Award, 
  BookOpen, 
  CalendarClock, 
  BarChart3, 
  Headphones, 
  Settings,
  LogOut,
  Building2,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type ProfessorLayoutProps = {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { value: "overview", title: "Visão Geral", icon: LayoutDashboard },
  { value: "turmas", title: "Minhas Turmas", icon: Users },
  { value: "alunos", title: "Alunos", icon: Users },
  { value: "presenca", title: "Registro de Presença", icon: CheckSquare },
  { value: "notas", title: "Notas e Avaliações", icon: Award },
  { value: "aulas", title: "Diário de Aulas", icon: BookOpen },
  { value: "calendario", title: "Calendário de Provas", icon: CalendarClock },
  { value: "relatorios", title: "Relatórios", icon: BarChart3 },
  { value: "chamados", title: "Chamados", icon: Headphones },
];

const mainMenuItems = [
  { title: "Visão Geral", value: "overview" },
  { title: "Minhas Turmas", value: "turmas" },
  { title: "Presença", value: "presenca" },
  { title: "Avaliações", value: "notas" },
  { title: "Calendário", value: "calendario" },
];

export const ProfessorLayout = ({ children, activeTab, onTabChange }: ProfessorLayoutProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "PR";
  };

  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ")[0];
    }
    return "Professor";
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
        <div className="max-w-screen-xl mx-auto h-16 flex items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 font-extrabold">
              <Building2 className="h-6 w-6" />
              <span className="text-lg">Prefeitura Municipal</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-5 ml-6">
              {mainMenuItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => onTabChange(item.value)}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === item.value
                      ? "bg-white/20"
                      : "text-blue-100 hover:bg-white/10"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg bg-white/15 hover:bg-white/25 text-white"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <button
              onClick={() => onTabChange("settings")}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white/20 border border-white/30 hover:bg-white/30 transition-colors cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-white text-primary font-extrabold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block leading-tight text-left">
                <div className="font-extrabold text-sm">{profile?.full_name || "Professor"}</div>
                <div className="text-xs opacity-90">Professor</div>
              </div>
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 px-3 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto flex gap-4 p-4">
        {/* Sidebar */}
        <aside 
          className={`${sidebarExpanded ? 'w-64' : 'w-[68px]'} flex-shrink-0 bg-card border border-border rounded-2xl shadow-sm p-2.5 flex flex-col gap-2 sticky top-20 h-[calc(100vh-96px)] transition-all duration-300`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                className={`h-11 flex items-center ${sidebarExpanded ? 'justify-start px-3' : 'justify-center'} rounded-xl transition-all border gap-3 ${
                  activeTab === item.value
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-primary border-transparent"
                }`}
                title={item.title}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.title}</span>}
              </button>
            );
          })}
          
          <div className="mt-auto" />
          
          <button
            onClick={() => onTabChange("settings")}
            className={`h-11 flex items-center ${sidebarExpanded ? 'justify-start px-3' : 'justify-center'} rounded-xl transition-all border gap-3 ${
              activeTab === "settings"
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground hover:bg-muted/50 hover:text-primary border-transparent"
            }`}
            title="Configurações"
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Configurações</span>}
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};