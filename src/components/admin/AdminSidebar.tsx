import { NavLink } from "react-router-dom";
import { Palette, Building2, Users, FileText, BarChart3, Link } from "lucide-react";
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

const menuItems = [
  { title: "Personalização", icon: Palette, value: "visual" },
  { title: "Secretarias", icon: Building2, value: "secretarias" },
  { title: "Usuários & Roles", icon: Users, value: "users" },
  { title: "Relacionamentos", icon: Link, value: "relationships" },
  { title: "Conteúdo", icon: FileText, value: "content" },
  { title: "Estatísticas", icon: BarChart3, value: "stats" },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar 
      className={`transition-all duration-300 ease-in-out border-r ${!open ? "w-16" : "w-64"}`}
      collapsible="icon"
    >
      <SidebarContent className="gap-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={`px-4 transition-opacity duration-200 ${!open ? "opacity-0" : "opacity-100"}`}>
            Administração
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
