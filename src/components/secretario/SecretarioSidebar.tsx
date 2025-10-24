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
  MessageSquare
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface SecretarioSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { value: "noticias", title: "Notícias", icon: Newspaper },
  { value: "stories", title: "Stories", icon: Video },
  { value: "push", title: "Push Notifications", icon: Bell },
  { value: "agenda", title: "Agenda da Cidade", icon: Calendar },
  { value: "galeria", title: "Galeria", icon: Image },
  { value: "eventos", title: "Eventos", icon: PartyPopper },
  { value: "transmissao", title: "Transmissão ao Vivo", icon: Radio },
  { value: "podcast", title: "Podcasts", icon: Podcast },
  { value: "banners", title: "Banners de Campanha", icon: Megaphone },
  { value: "solicitacoes", title: "Solicitações", icon: MessageSquare, showBadge: true },
  { value: "equipe", title: "Equipe", icon: Users },
];

export function SecretarioSidebar({ activeTab, onTabChange }: SecretarioSidebarProps) {
  const { open } = useSidebar();

  // Buscar contagem de solicitações pendentes
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-requests-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .single();

      if (!assignment) return 0;

      const { count } = await supabase
        .from("secretary_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_secretary_slug", assignment.secretaria_slug)
        .eq("status", "pendente");

      return count || 0;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  return (
    <Sidebar 
      className={`transition-all duration-300 ease-in-out border-r ${!open ? "w-16" : "w-64"}`}
      collapsible="icon"
    >
      <SidebarContent className="gap-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={`px-4 transition-opacity duration-200 ${!open ? "opacity-0" : "opacity-100"}`}>
            Secretaria de Comunicação
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    tooltip={!open ? item.title : undefined}
                    className={`transition-all duration-200 ${
                      activeTab === item.value
                        ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                        : "hover:bg-accent/50 hover:shadow-sm"
                    } ${!open ? "justify-center" : ""}`}
                  >
                    <item.icon className={`h-5 w-5 ${!open ? "" : "mr-3"}`} />
                    {open && (
                      <span className="truncate flex-1">{item.title}</span>
                    )}
                    {item.showBadge && pendingCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {pendingCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
