import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Bell, FileText } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

const PaisSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  return (
    <div className="w-64 border-r bg-background p-6 space-y-2">
      <h2 className="text-lg font-semibold mb-4">Painel dos Pais</h2>
      <button
        onClick={() => onTabChange("overview")}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          activeTab === "overview" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }`}
      >
        Visão Geral
      </button>
      <button
        onClick={() => onTabChange("children")}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          activeTab === "children" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }`}
      >
        Meus Filhos
      </button>
      <button
        onClick={() => onTabChange("communications")}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          activeTab === "communications" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }`}
      >
        Comunicados
      </button>
    </div>
  );
};

const PaisContent = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: children } = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("parent_student_relationship")
        .select(`
          *,
          student:student_id(*)
        `)
        .eq("parent_user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filhos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{children?.length || 0}</div>
                <p className="text-xs text-muted-foreground">filhos vinculados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reuniões</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">reuniões agendadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comunicados</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">novos comunicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Autorizações</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">pendente de assinatura</p>
              </CardContent>
            </Card>
          </div>
        );
      case "children":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Meus Filhos</CardTitle>
              <CardDescription>Acompanhe o desempenho e frequência dos seus filhos</CardDescription>
            </CardHeader>
            <CardContent>
              {children && children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child: any) => (
                    <div key={child.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium">{child.student?.full_name || "Nome não disponível"}</h3>
                      <p className="text-sm text-muted-foreground">
                        Relação: {child.relationship_type === 'pai' ? 'Pai' : child.relationship_type === 'mae' ? 'Mãe' : 'Responsável'}
                      </p>
                      {child.student?.birth_date && (
                        <p className="text-sm text-muted-foreground">
                          Nascimento: {new Date(child.student.birth_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum filho vinculado. Entre em contato com a escola.</p>
              )}
            </CardContent>
          </Card>
        );
      case "communications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Comunicados</CardTitle>
              <CardDescription>Mensagens e avisos da escola</CardDescription>
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
      <div className="flex min-h-screen w-full bg-background">
        <PaisSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-full items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Painel dos Pais</h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 bg-gradient-to-br from-background to-secondary/5 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const PainelPais = () => {
  return (
    <ProtectedRoute allowedRoles={["pai"]}>
      <PaisContent />
    </ProtectedRoute>
  );
};

export default PainelPais;
