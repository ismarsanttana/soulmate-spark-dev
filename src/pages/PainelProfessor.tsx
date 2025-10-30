import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, Calendar, FileText, Search, CheckSquare, Edit3, ClipboardList } from "lucide-react";
import { useState } from "react";
import { ProfessorLayout } from "@/components/professor/ProfessorLayout";
import { ProfessorProfile } from "@/components/professor/ProfessorProfile";
import { StudentBirthdays } from "@/components/professor/StudentBirthdays";
import { MyClasses } from "@/components/professor/MyClasses";
import { StudentsView } from "@/components/professor/StudentsView";
import { AttendanceRegistration } from "@/components/professor/AttendanceRegistration";
import { GradesManagementNew } from "@/components/professor/GradesManagementNew";
import { ClassDiary } from "@/components/professor/ClassDiary";
import { ExamCalendar } from "@/components/professor/ExamCalendar";
import { Reports } from "@/components/professor/Reports";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InactivityTimer } from "@/components/InactivityTimer";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const ProfessorContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const handleInactivityTimeout = async () => {
    await supabase.auth.signOut();
    toast.info("Sessão encerrada por inatividade");
    navigate("/auth");
  };

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

  // Buscar próximas avaliações
  const { data: upcomingExams } = useQuery({
    queryKey: ["professor-upcoming-exams", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("scheduled_assessments")
        .select("*, school_classes(class_name)")
        .eq("teacher_id", user.id)
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Dados mockados de frequência da semana (será implementado quando criar a tabela de frequência)
  const weeklyAttendance = {
    "segunda-feira": { present: 85, total: 100 },
    "terça-feira": { present: 92, total: 100 },
    "quarta-feira": { present: 88, total: 100 },
    "quinta-feira": { present: 90, total: 100 },
    "sexta-feira": { present: 87, total: 100 },
  };

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
                <h1 className="text-2xl font-bold">Olá, {profile?.full_name?.split(" ")[0] || "Professor"}</h1>
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

            {/* Botões de Atalho */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                size="lg" 
                className="h-auto py-4 flex-col gap-2 shadow-md hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("notas")}
              >
                <Edit3 className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold">Lançar Notas</div>
                  <div className="text-xs opacity-90">Por Turma</div>
                </div>
              </Button>

              <Button 
                size="lg" 
                className="h-auto py-4 flex-col gap-2 shadow-md hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("notas")}
              >
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold">Lançar Nota</div>
                  <div className="text-xs opacity-90">Individual</div>
                </div>
              </Button>

              <Button 
                size="lg" 
                className="h-auto py-4 flex-col gap-2 shadow-md hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("presenca")}
              >
                <CheckSquare className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold">Iniciar Chamada</div>
                  <div className="text-xs opacity-90">Presença</div>
                </div>
              </Button>

              <Button 
                size="lg" 
                className="h-auto py-4 flex-col gap-2 shadow-md hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("aulas")}
              >
                <ClipboardList className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold">Diário de Aulas</div>
                  <div className="text-xs opacity-90">Registrar</div>
                </div>
              </Button>
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
                      <div className="text-3xl font-extrabold mt-1">{upcomingExams?.length || 0}</div>
                      <div className="text-xs font-bold mt-0.5 text-muted-foreground">
                        {upcomingExams && upcomingExams.length > 0 
                          ? `Próxima: ${format(new Date(upcomingExams[0].scheduled_date), "dd/MM", { locale: ptBR })}`
                          : "—"
                        }
                      </div>
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
                    {["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira"].map((day, idx) => {
                      const dayData = weeklyAttendance?.[day] || { present: 0, total: 0 };
                      const percentage = dayData.total > 0 ? (dayData.present / dayData.total) * 100 : 0;
                      const height = percentage > 0 ? `${percentage}%` : '8px';
                      const dayShort = ["Seg", "Ter", "Qua", "Qui", "Sex"][idx];
                      
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary" 
                            style={{ height }}
                            title={`${percentage.toFixed(0)}% de presença`}
                          ></div>
                          <span className="text-xs text-muted-foreground font-medium">{dayShort}</span>
                          {percentage > 0 && (
                            <span className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</span>
                          )}
                        </div>
                      );
                    })}
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
                  {upcomingExams && upcomingExams.length > 0 ? (
                    <div className="space-y-2.5">
                      {upcomingExams.slice(0, 4).map((exam: any) => {
                        const examDate = new Date(exam.scheduled_date);
                        const isUpcoming = isFuture(examDate) || isToday(examDate);
                        
                        return (
                          <div
                            key={exam.id}
                            className="p-3 bg-muted/30 border border-border rounded-xl hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{exam.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {exam.school_classes?.class_name} • {exam.subject}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={isToday(examDate) ? "default" : "secondary"} className="text-[10px]">
                                    {format(examDate, "dd/MM/yyyy", { locale: ptBR })}
                                  </Badge>
                                  {exam.scheduled_time && (
                                    <span className="text-xs text-muted-foreground">{exam.scheduled_time}</span>
                                  )}
                                </div>
                              </div>
                              <Badge 
                                variant={exam.assessment_type === "Prova" ? "destructive" : "outline"}
                                className="text-[10px] shrink-0"
                              >
                                {exam.assessment_type}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {upcomingExams.length > 4 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => setActiveTab("calendario")}
                        >
                          Ver todas ({upcomingExams.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/20 border border-border rounded-xl">
                      <span className="text-sm text-muted-foreground">Sem aulas agendadas</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case "turmas":
        return <MyClasses />;
      
      case "alunos":
        return <StudentsView />;
      
      case "presenca":
        return <AttendanceRegistration />;
      
      case "notas":
        return <GradesManagementNew />;
      
      case "aulas":
        return <ClassDiary />;
      
      case "calendario":
        return <ExamCalendar />;
      
      case "aniversarios":
        return <StudentBirthdays />;
      
      case "relatorios":
        return <Reports />;
      
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
      <InactivityTimer onTimeout={handleInactivityTimeout} timeoutMinutes={30} />
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