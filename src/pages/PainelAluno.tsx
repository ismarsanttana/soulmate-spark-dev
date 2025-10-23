import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Calendar, Award, FileText } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

const AlunoSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  return (
    <div className="w-64 border-r bg-background p-6 space-y-2">
      <h2 className="text-lg font-semibold mb-4">Painel do Aluno</h2>
      <button
        onClick={() => onTabChange("overview")}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          activeTab === "overview" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }`}
      >
        Visão Geral
      </button>
      <button
        onClick={() => onTabChange("grades")}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          activeTab === "grades" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }`}
      >
        Notas
      </button>
      <button
        onClick={() => onTabChange("schedule")}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          activeTab === "schedule" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }`}
      >
        Horários
      </button>
    </div>
  );
};

const AlunoContent = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">disciplinas matriculadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">presença no bimestre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.5</div>
                <p className="text-xs text-muted-foreground">nota média do bimestre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atividades</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">atividades pendentes</p>
              </CardContent>
            </Card>
          </div>
        );
      case "grades":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Notas</CardTitle>
              <CardDescription>Acompanhe seu desempenho acadêmico</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "schedule":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Horário de Aulas</CardTitle>
              <CardDescription>Veja sua grade horária semanal</CardDescription>
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
        <AlunoSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-full items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Painel do Aluno</h1>
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

const PainelAluno = () => {
  return (
    <ProtectedRoute allowedRoles={["aluno"]}>
      <AlunoContent />
    </ProtectedRoute>
  );
};

export default PainelAluno;
