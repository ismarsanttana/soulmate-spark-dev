import { Home, Users, BookOpen, ClipboardList, User, Clock, ShoppingCart, Bus, BarChart2, Headset } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EducacaoSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { value: "painel", title: "Painel", icon: Home },
  { value: "equipe", title: "Equipe", icon: Users },
  { value: "turmas", title: "Gerenciar Turmas", icon: BookOpen },
  { value: "matriculas", title: "Matrículas", icon: ClipboardList },
  { value: "alunos", title: "Alunos", icon: User },
  { value: "ponto", title: "Ponto Eletrônico", icon: Clock },
  { value: "compras", title: "Compras", icon: ShoppingCart },
  { value: "frota", title: "Frota", icon: Bus },
  { value: "relatorios", title: "Relatórios", icon: BarChart2 },
  { value: "solicitacoes", title: "Solicitações", icon: Headset, showBadge: true },
];

export function EducacaoSidebar({ activeTab, onTabChange }: EducacaoSidebarProps) {
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
      className="ascom-sidebar sticky top-[88px] flex-shrink-0"
      style={{ height: "calc(100vh - 108px)" }}
    >
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Button
            key={item.value}
            variant="ghost"
            size="icon"
            onClick={() => onTabChange(item.value)}
            className={cn(
              "relative h-11 w-11 rounded-xl transition-all",
              activeTab === item.value
                ? "bg-primary/12 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-primary/8 hover:text-primary border border-transparent"
            )}
            title={item.title}
          >
            <item.icon className="h-5 w-5" />
            {item.showBadge && pendingCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </nav>
    </aside>
  );
}
