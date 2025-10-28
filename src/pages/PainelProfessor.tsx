import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, Calendar, FileText, Search } from "lucide-react";
import { useState } from "react";
import { ProfessorLayout } from "@/components/professor/ProfessorLayout";
import { ProfessorProfile } from "@/components/professor/ProfessorProfile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ProfessorContent = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

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

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Page Header */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">Olá, {user?.user_metadata?.full_name?.split(" ")[0] || "Professor"}</h1>
                <p className="text-sm text-muted-foreground">
                  Gestão de turmas, presença, avaliações e calendário
                </p>
              </div>
              
              <div className="relative flex-1 max-w-[520px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por turma, aluno, avaliação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-muted/50 border border-border h-10 px-3 rounded-xl text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{today}</span>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-muted-foreground">Turmas Ativas</div>
                      <div className="text-3xl font-extrabold mt-1">{classes?.length || 0}</div>
                      <div className="text-xs font-bold mt-0.5 text-muted-foreground">—</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-green-500 text-white flex items-center justify-center shadow">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-muted-foreground">Aulas Esta Semana</div>
                      <div className="text-3xl font-extrabold mt-1">0</div>
                      <div className="text-xs font-bold mt-0.5 text-muted-foreground">—</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-muted-foreground">Próximas Avaliações</div>
                      <div className="text-3xl font-extrabold mt-1">0</div>
                      <div className="text-xs font-bold mt-0.5 text-muted-foreground">—</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-muted-foreground">Pendências</div>
                      <div className="text-3xl font-extrabold mt-1">0</div>
                      <div className="text-xs font-bold mt-0.5 text-muted-foreground">—</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Frequência da Semana</CardTitle>
                      <CardDescription>Percentual de presença por dia</CardDescription>
                    </div>
                    <Badge variant="secondary" className="gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Atualizado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[120px] flex items-end justify-between gap-2">
                    {["Seg", "Ter", "Qua", "Qui", "Sex"].map((day) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-muted/30 rounded-t-lg h-full"></div>
                        <span className="text-xs text-muted-foreground font-medium">{day}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Distribuição de Notas</CardTitle>
                      <CardDescription>Últimas avaliações</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="gap-2">
                      <span className="text-lg">✓</span>
                      Iniciar Chamada
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <span className="text-lg">✎</span>
                      Lançar Nota
                    </Button>
                  </div>
                  <div className="h-[60px] bg-muted/20 rounded-lg"></div>
                </CardContent>
              </Card>
            </div>

            {/* Lists Section */}
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Minhas Turmas</CardTitle>
                  <CardDescription>Visão rápida das turmas ativas</CardDescription>
                </CardHeader>
                <CardContent>
                  {classes && classes.length > 0 ? (
                    <div className="space-y-2.5">
                      {classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl"
                        >
                          <div>
                            <div className="font-bold">{cls.class_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {cls.grade_level} — {cls.shift}
                            </div>
                          </div>
                          <Badge variant="secondary">{cls.school_year}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/20 border border-border rounded-xl">
                      <span className="text-sm text-muted-foreground">Nenhuma turma atribuída</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Próximas Aulas</CardTitle>
                  <CardDescription>Agenda das próximas aulas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/20 border border-border rounded-xl">
                    <span className="text-sm text-muted-foreground">Sem aulas agendadas</span>
                  </div>
                </CardContent>
              </Card>
            </div>
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
      
      case "alunos":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Alunos</CardTitle>
              <CardDescription>Visualize o desempenho dos alunos nas suas matérias</CardDescription>
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
      
      case "settings":
        return <ProfessorProfile />;
      
      default:
        return null;
    }
  };

  return (
    <ProfessorLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </ProfessorLayout>
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