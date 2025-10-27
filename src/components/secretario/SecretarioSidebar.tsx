import { 
  Newspaper, 
  Video, 
  Bell, 
  Calendar, 
  Image, 
  PartyPopper, 
  Radio, 
  Podcast, 
  Megaphone,
  Users,
  MessageSquare,
  LayoutDashboard,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SecretarioSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { value: "painel", title: "Painel", icon: LayoutDashboard },
  { value: "noticias", title: "Notícias", icon: Newspaper },
  { value: "stories", title: "Stories", icon: Video },
  { value: "push", title: "Push Notifications", icon: Bell },
  { value: "agenda", title: "Agenda da Cidade", icon: Calendar },
  { value: "galeria", title: "Galeria", icon: Image },
  { value: "eventos", title: "Eventos", icon: PartyPopper },
  { value: "transmissao", title: "Transmissão ao Vivo", icon: Radio },
  { value: "podcast", title: "Podcasts", icon: Podcast },
  { value: "banners", title: "Banners de Campanha", icon: Megaphone },
  { value: "relatorios", title: "Relatórios", icon: FileText },
  { value: "solicitacoes", title: "Solicitações", icon: MessageSquare, showBadge: true },
  { value: "equipe", title: "Equipe", icon: Users },
];

export function SecretarioSidebar({ activeTab, onTabChange }: SecretarioSidebarProps) {
  const { data: pendingCount } = useQuery({
    queryKey: ["pending-requests-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!assignment) return 0;

      const { count } = await supabase
        .from("secretary_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_secretary_slug", assignment.secretaria_slug)
        .eq("status", "pendente");

      return count || 0;
    },
    refetchInterval: 30000,
  });

  return (
    <aside className="w-[68px] flex-shrink-0 bg-card border border-border rounded-2xl shadow-sm p-2.5 flex flex-col gap-2 sticky top-[86px] h-[calc(100vh-110px)]">
      {menuItems.map((item) => (
        <button
          key={item.value}
          onClick={() => onTabChange(item.value)}
          className={cn(
            "ascom-sidebar-icon relative",
            activeTab === item.value && "active"
          )}
          title={item.title}
        >
          <item.icon className="h-5 w-5" />
          {item.showBadge && pendingCount !== undefined && pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      ))}
    </aside>
  );
}
