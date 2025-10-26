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

const Educacao = () => {
  const secretaria = getSecretariaBySlug("educacao");
  const [boletimMatricula, setBoletimMatricula] = useState("");
  const [boletimData, setBoletimData] = useState<any>(null);
  const [matriculaSuccess, setMatriculaSuccess] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalEvent, setCalendarModalEvent] = useState<{ day: number; event: string } | null>(null);
  const assistantInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assistantOpen && assistantInputRef.current) {
      assistantInputRef.current.focus();
    }
  }, [assistantOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && assistantOpen) {
        setAssistantOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [assistantOpen]);

  const handleBoletimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boletimMatricula === "2025-67890") {
      setBoletimData({
        nome: "Maria Fernanda",
        serie: "8º ano",
        notas: [
          { disciplina: "Português", nota: 9.5 },
          { disciplina: "Matemática", nota: 8.8 },
          { disciplina: "História", nota: 9.2 },
          { disciplina: "Geografia", nota: 9.0 },
          { disciplina: "Ciências", nota: 8.5 }
        ]
      });
    } else if (boletimMatricula === "2025-12345") {
      setBoletimData({
        nome: "João Pedro",
        serie: "6º ano",
        notas: [
          { disciplina: "Português", nota: 8.2 },
          { disciplina: "Matemática", nota: 7.9 },
          { disciplina: "História", nota: 8.5 },
          { disciplina: "Geografia", nota: 8.0 },
          { disciplina: "Ciências", nota: 7.8 }
        ]
      });
    } else {
      setBoletimData({ nome: null });
    }
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

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assistantMessage.trim()) {
      console.log("Mensagem do assistente:", assistantMessage);
      setAssistantMessage("");
    }
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
                      <p className="text-sm text-muted-foreground mb-3">Série: {boletimData.serie}</p>
                      <div className="space-y-2">
                        {boletimData.notas.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-background rounded">
                            <span className="text-sm font-medium">{item.disciplina}</span>
                            <span className="text-sm font-bold text-primary">{item.nota}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-destructive text-sm">Matrícula não encontrada. Tente 2025-67890 ou 2025-12345.</p>
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

        {/* Virtual Assistant FAB */}
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-52 right-6 w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
          aria-label="Abrir assistente virtual"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* Virtual Assistant Panel */}
        {assistantOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setAssistantOpen(false)}
            />
            <div className="relative bg-card border-l border-t border-border w-full max-w-sm h-[70vh] shadow-2xl flex flex-col animate-in slide-in-from-right">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-lg">Assistente Virtual</h3>
                <button
                  onClick={() => setAssistantOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label="Fechar assistente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold mb-2">Sugestões rápidas:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Como consultar o boletim escolar?</li>
                    <li>• Informações sobre matrícula</li>
                    <li>• Horários do transporte escolar</li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleAssistantSubmit} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    ref={assistantInputRef}
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={assistantMessage}
                    onChange={(e) => setAssistantMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </Layout>
  );
};

export default Educacao;
