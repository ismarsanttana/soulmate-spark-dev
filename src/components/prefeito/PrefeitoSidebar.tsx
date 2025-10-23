import { LayoutDashboard, FileText, Download } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { generatePDFReport } from "@/lib/pdfGenerator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PrefeitoSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["prefeito-stats"],
    queryFn: async () => {
      const [
        appointmentsResult,
        protocolsResult,
        usersResult,
        notificationsResult,
        eventsResult,
        newsResult,
        secretariasResult,
      ] = await Promise.all([
        supabase.from("appointments").select("id, status", { count: "exact" }),
        supabase.from("ombudsman_protocols").select("id, status, category", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("notifications").select("id", { count: "exact" }),
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("news").select("id", { count: "exact" }),
        supabase.from("secretarias").select("id, is_active", { count: "exact" }),
      ]);

      const appointmentsPending = appointmentsResult.data?.filter(
        (a) => a.status === "pendente"
      ).length || 0;
      
      const protocolsOpen = protocolsResult.data?.filter(
        (p) => p.status === "aberto"
      ).length || 0;
      
      const protocolsClosed = protocolsResult.data?.filter(
        (p) => p.status === "encerrado"
      ).length || 0;

      return {
        totalUsers: usersResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        appointmentsPending,
        totalProtocols: protocolsResult.count || 0,
        protocolsOpen,
        protocolsClosed,
        totalNotifications: notificationsResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalNews: newsResult.count || 0,
        totalSecretarias: secretariasResult.data?.filter((s) => s.is_active).length || 0,
      };
    },
  });

  const handleGenerateReport = async () => {
    if (isLoading || !stats) {
      toast.error("Aguarde o carregamento dos dados");
      return;
    }

    try {
      toast.loading("Gerando relatório...");
      await generatePDFReport({
        title: "Relatório Geral - Painel do Prefeito",
        data: stats,
        type: "geral",
      });
      toast.dismiss();
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao gerar relatório");
      console.error(error);
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/painel-prefeito",
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={currentPath === item.path}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4" />
                  <span>Relatório Geral</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
