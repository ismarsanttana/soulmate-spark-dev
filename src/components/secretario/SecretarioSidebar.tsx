import { 
  Newspaper, 
  Video, 
  Bell, 
  Calendar, 
  Image, 
  PartyPopper, 
  Radio, 
  Podcast, 
  Megaphone 
} from "lucide-react";
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
];

export function SecretarioSidebar({ activeTab, onTabChange }: SecretarioSidebarProps) {
  const { open } = useSidebar();

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
                    {open && <span className="truncate">{item.title}</span>}
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
