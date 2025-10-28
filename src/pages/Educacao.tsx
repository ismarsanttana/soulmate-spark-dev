import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { MessageCircle, X, Send, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getSecretariaBySlug } from "@/lib/secretarias";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Educacao = () => {
  const secretaria = getSecretariaBySlug("educacao");
  const [boletimMatricula, setBoletimMatricula] = useState("");
  const [boletimData, setBoletimData] = useState<any>(null);
  const [matriculaSuccess, setMatriculaSuccess] = useState("");
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalEvent, setCalendarModalEvent] = useState<{ day: number; event: string } | null>(null);

  // Buscar usuário logado e seus filhos
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: children = [] } = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data } = await supabase
        .from("parent_student_relationship")
        .select("*")
        .eq("parent_user_id", user.id);
      
      if (!data) return [];
      
      const studentIds = data.map(r => r.student_id);
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("matricula, student_id")
        .in("student_id", studentIds);
      
      return enrollments || [];
    },
    enabled: !!user,
  });

  const handleBoletimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Buscar aluno pela matrícula
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("student_enrollments")
      .select(`
        *,
        student:student_id(*),
        class:class_id(*)
      `)
      .eq("matricula", boletimMatricula)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      setBoletimData({ nome: null });
      toast.error("Matrícula não encontrada");
      return;
    }

    // Verificar permissões
    if (!user) {
      setBoletimData({ nome: null });
      toast.error("Você precisa estar logado para consultar boletins");
      return;
    }

    // Verificar roles do usuário
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const hasEducationRole = roles?.some(r => 
      r.role === 'admin' || r.role === 'secretario' || r.role === 'professor'
    );

    // Se não tiver role de educação, verificar se é pai/mãe do aluno
    if (!hasEducationRole) {
      const { data: relationship } = await supabase
        .from("parent_student_relationship")
        .select("id")
        .eq("parent_user_id", user.id)
        .eq("student_id", enrollment.student_id)
        .maybeSingle();

      if (!relationship) {
        setBoletimData({ nome: null });
        toast.error("Você só pode consultar informações dos seus filhos");
        return;
      }
    }

    // Buscar notas do aluno
    const { data: grades } = await supabase
      .from("student_grades")
      .select("*")
      .eq("student_id", enrollment.student_id)
      .order("assessment_date", { ascending: false });

    setBoletimData({
      nome: enrollment.student?.full_name,
      serie: enrollment.class?.grade_level || enrollment.grade_level,
      turma: enrollment.class?.class_name,
      notas: grades?.map(g => ({
        disciplina: g.subject,
        nota: g.grade,
        data: new Date(g.assessment_date).toLocaleDateString('pt-BR')
      })) || []
    });

    setTimeout(() => {
      document.getElementById("boletim-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleMatriculaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nomeAluno = formData.get("nomeAluno");
    const escola = formData.get("escola");
    const serie = formData.get("serie");
    setMatriculaSuccess(`Solicitação enviada com sucesso! Dados: ${nomeAluno}, ${serie}, ${escola}. Em breve entraremos em contato.`);
    e.currentTarget.reset();
    setTimeout(() => setMatriculaSuccess(""), 8000);
  };

  const calendarEvents: Record<number, string> = {
    5: "Reunião pedagógica",
    6: "Início das aulas",
    8: "Entrega de materiais",
    12: "Prova diagnóstica",
    15: "Feriado municipal",
    18: "Reunião com responsáveis",
    20: "Avaliação Português",
    25: "Feira de Ciências",
    27: "Simulado ENEM"
  };

  const handleCalendarDayClick = (day: number) => {
    if (calendarEvents[day]) {
      setCalendarModalEvent({ day, event: calendarEvents[day] });
      setCalendarModalOpen(true);
    }
  };

  return (
    <Layout>
      <Header pageTitle="Secretaria de Educação" />

      <div className="space-y-6">
        {/* Title Section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-1">{secretaria?.title || "Educação"}</h3>
          <p className="text-muted-foreground text-sm">{secretaria?.description}</p>
        </div>

          {/* Boletim Escolar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Boletim Escolar</CardTitle>
              <CardDescription>Consulte as notas do aluno</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBoletimSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="boletim-matricula">Número de matrícula</Label>
                  <Input
                    id="boletim-matricula"
                    placeholder="Ex: 2025-67890"
                    value={boletimMatricula}
                    onChange={(e) => setBoletimMatricula(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Consultar</Button>
              </form>

              {boletimData && (
                <div id="boletim-result" className="mt-4 p-4 bg-muted rounded-lg">
                  {boletimData.nome ? (
                    <>
                      <h4 className="font-bold mb-2">Aluno: {boletimData.nome}</h4>
                      <p className="text-sm text-muted-foreground mb-1">Série: {boletimData.serie}</p>
                      {boletimData.turma && (
                        <p className="text-sm text-muted-foreground mb-3">Turma: {boletimData.turma}</p>
                      )}
                      {boletimData.notas.length > 0 ? (
                        <div className="space-y-2">
                          {boletimData.notas.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-background rounded">
                              <div>
                                <span className="text-sm font-medium">{item.disciplina}</span>
                                {item.data && (
                                  <span className="text-xs text-muted-foreground ml-2">({item.data})</span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-primary">{item.nota}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma nota lançada ainda.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-destructive text-sm">Matrícula não encontrada ou você não tem permissão para visualizar.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matrícula Escolar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Matrícula Escolar</CardTitle>
              <CardDescription>Solicite ou atualize a matrícula do aluno</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMatriculaSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeAluno">Nome completo do aluno</Label>
                  <Input id="nomeAluno" name="nomeAluno" required />
                </div>
                <div>
                  <Label htmlFor="dataNascimento">Data de nascimento</Label>
                  <Input id="dataNascimento" name="dataNascimento" type="date" required />
                </div>
                <div>
                  <Label htmlFor="serie">Série/Etapa</Label>
                  <Input id="serie" name="serie" placeholder="Ex: 5º ano" required />
                </div>
                <div>
                  <Label htmlFor="numeroMatricula">Número da matrícula (se houver)</Label>
                  <Input id="numeroMatricula" name="numeroMatricula" placeholder="Ex: 2025-12345" />
                </div>
                <div>
                  <Label htmlFor="escola">Escola de interesse</Label>
                  <Select name="escola" required>
                    <SelectTrigger id="escola">
                      <SelectValue placeholder="Selecione uma escola" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escola1">Escola Municipal Dr. José Fernandes</SelectItem>
                      <SelectItem value="escola2">Escola Municipal Maria da Conceição</SelectItem>
                      <SelectItem value="escola3">Escola Estadual Monsenhor Expedito</SelectItem>
                      <SelectItem value="escola4">Escola Municipal São Francisco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="turno">Turno pretendido</Label>
                  <Select name="turno" required>
                    <SelectTrigger id="turno">
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matutino">Matutino</SelectItem>
                      <SelectItem value="vespertino">Vespertino</SelectItem>
                      <SelectItem value="integral">Integral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nomeResponsavel">Nome do responsável</Label>
                  <Input id="nomeResponsavel" name="nomeResponsavel" required />
                </div>
                <div>
                  <Label htmlFor="contatoResponsavel">Contato do responsável</Label>
                  <Input id="contatoResponsavel" name="contatoResponsavel" type="tel" placeholder="(00) 00000-0000" required />
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea id="observacoes" name="observacoes" placeholder="Alguma informação adicional?" rows={3} />
                </div>
                <Button type="submit" className="w-full">Enviar solicitação</Button>
              </form>

              {matriculaSuccess && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-lg">
                  <p className="text-sm text-primary font-medium">{matriculaSuccess}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transporte Escolar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transporte Escolar</CardTitle>
              <CardDescription>Acompanhamento em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">Rota 02 — Centro ⇄ Sítio Malhada</h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-full">Em rota</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Ônibus 12 • Monitor: Ana Luísa</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm">Centro — Concluído</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                    <span className="text-sm font-semibold">Lagoa do Barro — Em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <span className="text-sm text-muted-foreground">Sítio Malhada — Próximo</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">Rota 05 — Distrito Pindoba ⇄ Centro</h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-accent/20 text-accent rounded-full">Preparando saída</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Ônibus 07 • Monitor: José Carlos</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <span className="text-sm text-muted-foreground">Pindoba — Aguardando</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <span className="text-sm text-muted-foreground">Cachoeira — Aguardando</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <span className="text-sm text-muted-foreground">Centro — Aguardando</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendário Letivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Calendário Letivo — Janeiro 2025
              </CardTitle>
              <CardDescription>Clique nos dias para ver eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="text-xs font-semibold text-muted-foreground">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const hasEvent = !!calendarEvents[day];
                  const isExam = day === 12 || day === 20 || day === 27;
                  const isHoliday = day === 15;
                  return (
                    <div
                      key={day}
                      onClick={() => handleCalendarDayClick(day)}
                      className={`calendar-day ${isExam ? "exam" : ""} ${isHoliday ? "holiday" : ""} ${hasEvent ? "" : "cursor-default"}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Calendar Event Modal */}
      <AlertDialog open={calendarModalOpen} onOpenChange={setCalendarModalOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Dia {calendarModalEvent?.day} — {calendarModalEvent?.event}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este é um evento do calendário letivo. Para mais informações, entre em contato com a secretaria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setCalendarModalOpen(false)}>Fechar</Button>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Educacao;
