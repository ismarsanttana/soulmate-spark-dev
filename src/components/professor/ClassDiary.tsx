import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Edit, Trash2, CalendarIcon } from "lucide-react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ClassDiary = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    subject: "",
    lesson_date: new Date(),
    lesson_number: "",
    topic: "",
    content: "",
    methodology: "",
    homework: "",
    observations: "",
    students_present: "",
    students_absent: "",
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

  const { data: entries, isLoading } = useQuery({
    queryKey: ["class-diary-entries", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from("class_diary" as any)
        .select("*")
        .eq("class_id", selectedClass)
        .order("lesson_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      if (editingEntry) {
        const { error } = await supabase
          .from("class_diary" as any)
          .update(data)
          .eq("id", editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("class_diary" as any)
          .insert({
            ...data,
            class_id: selectedClass,
            recorded_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingEntry ? "Diário atualizado!" : "Aula registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["class-diary-entries"] });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar diário");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("class_diary" as any)
        .delete()
        .eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído!");
      queryClient.invalidateQueries({ queryKey: ["class-diary-entries"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao excluir registro");
    },
  });

  const handleOpenDialog = (entry?: any) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        subject: entry.subject,
        lesson_date: new Date(entry.lesson_date),
        lesson_number: entry.lesson_number.toString(),
        topic: entry.topic,
        content: entry.content,
        methodology: entry.methodology || "",
        homework: entry.homework || "",
        observations: entry.observations || "",
        students_present: entry.students_present?.toString() || "",
        students_absent: entry.students_absent?.toString() || "",
      });
    } else {
      setEditingEntry(null);
      setFormData({
        subject: "",
        lesson_date: new Date(),
        lesson_number: "",
        topic: "",
        content: "",
        methodology: "",
        homework: "",
        observations: "",
        students_present: "",
        students_absent: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
  };

  const handleSubmit = () => {
    if (!formData.subject || !formData.topic || !formData.content) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    saveMutation.mutate({
      subject: formData.subject,
      lesson_date: format(formData.lesson_date, "yyyy-MM-dd"),
      lesson_number: parseInt(formData.lesson_number) || 0,
      topic: formData.topic,
      content: formData.content,
      methodology: formData.methodology,
      homework: formData.homework,
      observations: formData.observations,
      students_present: formData.students_present ? parseInt(formData.students_present) : null,
      students_absent: formData.students_absent ? parseInt(formData.students_absent) : null,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Diário de Aulas
              </CardTitle>
              <CardDescription>
                Registre o conteúdo ministrado em cada aula
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={!selectedClass}
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Aula
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
                  <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : entries && entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold">{entry.topic}</h4>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {entry.subject}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                            Aula #{entry.lesson_number}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {format(new Date(entry.lesson_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-sm mb-2">{entry.content}</div>
                        {entry.homework && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Tarefa:</strong> {entry.homework}
                          </div>
                        )}
                        {(entry.students_present || entry.students_absent) && (
                          <div className="text-sm text-muted-foreground mt-2">
                            Presentes: {entry.students_present || 0} • Ausentes: {entry.students_absent || 0}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Deseja realmente excluir este registro?")) {
                              deleteMutation.mutate(entry.id);
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
                Nenhuma aula registrada
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Editar Registro" : "Registrar Nova Aula"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da aula ministrada
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
                <Label>Número da Aula</Label>
                <Input
                  type="number"
                  value={formData.lesson_number}
                  onChange={(e) => setFormData({ ...formData, lesson_number: e.target.value })}
                  placeholder="Ex: 1"
                />
              </div>
            </div>

            <div>
              <Label>Data da Aula *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.lesson_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.lesson_date
                      ? format(formData.lesson_date, "PPP", { locale: ptBR })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.lesson_date}
                    onSelect={(date) => date && setFormData({ ...formData, lesson_date: date })}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Tema da Aula *</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ex: Equações do 2º Grau"
              />
            </div>

            <div>
              <Label>Conteúdo Ministrado *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Descreva o conteúdo da aula..."
                rows={4}
              />
            </div>

            <div>
              <Label>Metodologia</Label>
              <Textarea
                value={formData.methodology}
                onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                placeholder="Métodos utilizados na aula..."
                rows={2}
              />
            </div>

            <div>
              <Label>Tarefa de Casa</Label>
              <Textarea
                value={formData.homework}
                onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                placeholder="Atividades para casa..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Alunos Presentes</Label>
                <Input
                  type="number"
                  value={formData.students_present}
                  onChange={(e) => setFormData({ ...formData, students_present: e.target.value })}
                />
              </div>

              <div>
                <Label>Alunos Ausentes</Label>
                <Input
                  type="number"
                  value={formData.students_absent}
                  onChange={(e) => setFormData({ ...formData, students_absent: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
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
