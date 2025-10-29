import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Plus, Edit, Trash2, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ExamCalendar = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    subject: "",
    title: "",
    assessment_type: "Prova" as string,
    scheduled_date: new Date(),
    scheduled_time: "",
    duration_minutes: "",
    topics: "",
    description: "",
  });

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
        .select("id, class_name, grade_level")
        .eq("teacher_user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exam-schedule", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from("scheduled_assessments")
        .select("*")
        .eq("class_id", selectedClass)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      if (editingExam) {
        const { error } = await supabase
          .from("scheduled_assessments")
          .update(data)
          .eq("id", editingExam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("scheduled_assessments")
          .insert({
            ...data,
            class_id: selectedClass,
            teacher_id: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingExam ? "Avaliação atualizada!" : "Avaliação agendada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["exam-schedule"] });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar avaliação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from("scheduled_assessments")
        .delete()
        .eq("id", examId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação excluída!");
      queryClient.invalidateQueries({ queryKey: ["exam-schedule"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao excluir avaliação");
    },
  });

  const handleOpenDialog = (exam?: any) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        subject: exam.subject,
        title: exam.title,
        assessment_type: exam.assessment_type,
        scheduled_date: new Date(exam.scheduled_date),
        scheduled_time: exam.scheduled_time || "",
        duration_minutes: exam.duration_minutes?.toString() || "",
        topics: exam.topics?.join(", ") || "",
        description: exam.description || "",
      });
    } else {
      setEditingExam(null);
      setFormData({
        subject: "",
        title: "",
        assessment_type: "Prova",
        scheduled_date: new Date(),
        scheduled_time: "",
        duration_minutes: "",
        topics: "",
        description: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = () => {
    if (!formData.subject || !formData.title) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const topicsArray = formData.topics
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    saveMutation.mutate({
      subject: formData.subject,
      title: formData.title,
      assessment_type: formData.assessment_type,
      scheduled_date: format(formData.scheduled_date, "yyyy-MM-dd"),
      scheduled_time: formData.scheduled_time || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      topics: topicsArray,
      description: formData.description,
    });
  };

  const getExamTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      prova: "bg-red-500",
      avaliacao: "bg-blue-500",
      simulado: "bg-purple-500",
      recuperacao: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getExamStatusBadge = (date: string) => {
    const examDate = new Date(date);
    if (isPast(examDate) && !isToday(examDate)) {
      return <Badge variant="secondary">Realizada</Badge>;
    }
    if (isToday(examDate)) {
      return <Badge className="bg-green-500">Hoje</Badge>;
    }
    if (isFuture(examDate)) {
      return <Badge className="bg-blue-500">Agendada</Badge>;
    }
    return null;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Calendário de Provas
              </CardTitle>
              <CardDescription>
                Agende e visualize o calendário de avaliações
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={!selectedClass}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agendar Prova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_name} - {cls.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : exams && exams.length > 0 ? (
              <div className="space-y-3">
                {exams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold">{exam.title}</h4>
                          <Badge className={getExamTypeColor(exam.assessment_type)}>
                            {exam.assessment_type}
                          </Badge>
                          {getExamStatusBadge(exam.scheduled_date)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-semibold">{exam.subject}</span> •{" "}
                          {format(new Date(exam.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {exam.scheduled_time && ` às ${exam.scheduled_time}`}
                          {exam.duration_minutes && ` • ${exam.duration_minutes} min`}
                        </div>

                        {exam.topics && exam.topics.length > 0 && (
                          <div className="text-sm mb-2">
                            <strong>Conteúdo:</strong> {exam.topics.join(", ")}
                          </div>
                        )}

                        {exam.description && (
                          <div className="text-sm text-muted-foreground">
                            {exam.description}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(exam)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Deseja realmente excluir esta prova?")) {
                              deleteMutation.mutate(exam.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma prova agendada
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExam ? "Editar Prova" : "Agendar Nova Prova"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da avaliação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Matéria *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Matemática"
                />
              </div>

              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.assessment_type}
                  onValueChange={(value: any) => setFormData({ ...formData, assessment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prova">Prova</SelectItem>
                    <SelectItem value="Trabalho">Trabalho</SelectItem>
                    <SelectItem value="Atividade">Atividade</SelectItem>
                    <SelectItem value="Simulado">Simulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Título da Avaliação *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Prova Bimestral de Português"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduled_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduled_date
                        ? format(formData.scheduled_date, "PPP", { locale: ptBR })
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_date}
                      onSelect={(date) => date && setFormData({ ...formData, scheduled_date: date })}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="Ex: 90"
              />
            </div>

            <div>
              <Label>Conteúdo (separado por vírgula)</Label>
              <Textarea
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                placeholder="Ex: Interpretação de texto, Verbos, Acentuação"
                rows={2}
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da avaliação..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
