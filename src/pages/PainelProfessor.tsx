import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Calendar, FileText, ClipboardCheck, GraduationCap, MessageSquare, BarChart3 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const menuItems = [
  { value: "overview", title: "Visão Geral", icon: BarChart3 },
  { value: "turmas", title: "Minhas Turmas", icon: Users },
  { value: "presenca", title: "Registro de Presença", icon: ClipboardCheck },
  { value: "notas", title: "Notas e Avaliações", icon: GraduationCap },
  { value: "aulas", title: "Diário de Aulas", icon: BookOpen },
  { value: "calendario", title: "Calendário de Provas", icon: Calendar },
  { value: "relatorios", title: "Relatórios", icon: FileText },
  { value: "chamados", title: "Chamados", icon: MessageSquare },
];

const ProfessorSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <h2 className="text-lg font-semibold">Painel do Professor</h2>
            <p className="text-sm text-muted-foreground">Gestão de Turmas</p>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.value)}
                      isActive={activeTab === item.value}
                      tooltip={item.title}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const ProfessorContent = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["professor-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("school_classes")
        .select("*")
        .eq("teacher_user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classes?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">turmas sob sua responsabilidade</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aulas Esta Semana</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">aulas registradas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próximas Avaliações</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">provas agendadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendências</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">notas para lançar</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Minhas Turmas</CardTitle>
                <CardDescription>Visão rápida das suas turmas ativas</CardDescription>
              </CardHeader>
              <CardContent>
                {classes && classes.length > 0 ? (
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{cls.class_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cls.grade_level} - {cls.shift} - {cls.school_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{cls.school_year}</p>
                          <p className="text-xs text-muted-foreground">Ano Letivo</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma turma atribuída</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case "turmas":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Turmas</CardTitle>
              <CardDescription>Gerencie suas turmas e visualize informações detalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "presenca":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Registro de Presença</CardTitle>
              <CardDescription>Faça a chamada diária dos alunos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "notas":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notas e Avaliações</CardTitle>
              <CardDescription>Gerencie notas, avaliações e trabalhos dos alunos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "aulas":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Diário de Aulas</CardTitle>
              <CardDescription>Registre o conteúdo ministrado em cada aula</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "calendario":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Provas</CardTitle>
              <CardDescription>Agende e visualize o calendário de avaliações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "relatorios":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Gere relatórios detalhados de notas e desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "chamados":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Chamados para Secretaria</CardTitle>
              <CardDescription>Abra e acompanhe chamados para a secretaria de educação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ProfessorSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

const PainelProfessor = () => {
  return (
    <ProtectedRoute allowedRoles={["professor"]}>
      <ProfessorContent />
    </ProtectedRoute>
  );
};

export default PainelProfessor;
