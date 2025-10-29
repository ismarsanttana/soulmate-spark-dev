import { useState } from "react";
import { Home, Users, BookOpen, ClipboardList, User, Clock, ShoppingCart, Bus, BarChart2, Headset, GraduationCap, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface EducacaoSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { value: "painel", title: "Painel", icon: Home },
  { value: "equipe", title: "Equipe", icon: Users },
  { value: "professores", title: "Professores", icon: GraduationCap },
  { value: "turmas", title: "Gerenciar Turmas", icon: BookOpen },
  { value: "matriculas", title: "Matrículas", icon: ClipboardList },
  { value: "alunos", title: "Alunos", icon: User },
  { value: "inep", title: "INEP", icon: Database },
  { value: "ponto", title: "Ponto Eletrônico", icon: Clock },
  { value: "compras", title: "Compras", icon: ShoppingCart },
  { value: "frota", title: "Frota", icon: Bus },
  { value: "relatorios", title: "Relatórios", icon: BarChart2 },
  { value: "solicitacoes", title: "Solicitações", icon: Headset, showBadge: true },
];

export function EducacaoSidebar({ activeTab, onTabChange }: EducacaoSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["secretary-requests-pending-count-educacao"],
    queryFn: async () => {
      const { count } = await supabase
        .from("secretary_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_secretary_slug", "educacao")
        .eq("status", "pendente");

      return count || 0;
    },
    refetchInterval: 30000,
  });

  return (
    <aside 
      className={cn(
        "flex-shrink-0 bg-card border border-border rounded-2xl shadow-sm p-2.5 flex flex-col gap-2 sticky top-[86px] h-[calc(100vh-110px)] transition-all duration-300",
        isExpanded ? "w-[200px]" : "w-[68px]"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {menuItems.map((item) => (
        <button
          key={item.value}
          onClick={() => onTabChange(item.value)}
          className={cn(
            "ascom-sidebar-icon relative",
            activeTab === item.value && "active",
            isExpanded ? "justify-start" : "justify-center"
          )}
          title={item.title}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          {isExpanded && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">
              {item.title}
            </span>
          )}
          {item.showBadge && pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      ))}
    </aside>
  );
}
