import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, Plus, Edit, Trash2 } from "lucide-react";
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
import { CalendarIcon } from "lucide-react";

export const GradesManagement = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    subject: "",
    assessment_type: "prova" as const,
    assessment_name: "",
    grade: "",
    assessment_date: new Date(),
    comments: "",
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

  const { data: students } = useQuery({
    queryKey: ["class-students-grades", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          student:profiles(id, full_name)
        `)
        .eq("class_id", selectedClass)
        .eq("status", "active");
      if (error) throw error;
      return enrollments || [];
    },
    enabled: !!selectedClass,
  });

  const { data: grades, isLoading } = useQuery({
    queryKey: ["student-grades", selectedClass, selectedStudent],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      let query = supabase
        .from("student_grades" as any)
        .select(`
          *,
          student:profiles(full_name)
        `)
        .eq("class_id", selectedClass)
        .order("assessment_date", { ascending: false });

      if (selectedStudent && selectedStudent !== "all") {
        query = query.eq("student_id", selectedStudent);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      if (editingGrade) {
        const { error } = await supabase
          .from("student_grades" as any)
          .update(data)
          .eq("id", editingGrade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("student_grades" as any)
          .insert({
            ...data,
            class_id: selectedClass,
            recorded_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingGrade ? "Nota atualizada!" : "Nota lançada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["student-grades"] });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar nota");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (gradeId: string) => {
      const { error } = await supabase
        .from("student_grades" as any)
        .delete()
        .eq("id", gradeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota excluída!");
      queryClient.invalidateQueries({ queryKey: ["student-grades"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao excluir nota");
    },
  });

  const handleOpenDialog = (grade?: any) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({
        subject: grade.subject,
        assessment_type: grade.assessment_type,
        assessment_name: grade.assessment_name,
        grade: grade.grade.toString(),
        assessment_date: new Date(grade.assessment_date),
        comments: grade.comments || "",
      });
      setSelectedStudent(grade.student_id);
    } else {
      setEditingGrade(null);
      setFormData({
        subject: "",
        assessment_type: "prova",
        assessment_name: "",
        grade: "",
        assessment_date: new Date(),
        comments: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGrade(null);
  };

  const handleSubmit = () => {
    if (!selectedStudent || selectedStudent === "all") {
      toast.error("Selecione um aluno");
      return;
    }

    const gradeValue = parseFloat(formData.grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
      toast.error("Nota deve ser entre 0 e 10");
      return;
    }

    saveMutation.mutate({
      student_id: selectedStudent,
      subject: formData.subject,
      assessment_type: formData.assessment_type,
      assessment_name: formData.assessment_name,
      grade: gradeValue,
      assessment_date: format(formData.assessment_date, "yyyy-MM-dd"),
      comments: formData.comments,
    });
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return "text-green-600";
    if (grade >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateAverage = () => {
    if (!grades || grades.length === 0) return "-";
    const sum = grades.reduce((acc: number, g: any) => acc + parseFloat(g.grade), 0);
    return (sum / grades.length).toFixed(2);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Notas e Avaliações
              </CardTitle>
              <CardDescription>
                Gerencie notas e avaliações dos alunos
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={!selectedClass}
            >
              <Plus className="h-4 w-4 mr-2" />
              Lançar Nota
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="flex-1">
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

            {selectedClass && (
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filtrar por aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alunos</SelectItem>
                  {students?.map((enrollment: any) => (
                    <SelectItem key={enrollment.student_id} value={enrollment.student_id}>
                      {enrollment.student?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Média Geral</div>
              <div className="text-3xl font-bold">{calculateAverage()}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : grades && grades.length > 0 ? (
                <div className="space-y-3">
                  {grades.map((grade: any) => (
                    <div
                      key={grade.id}
                      className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{grade.student?.full_name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {grade.subject}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {grade.assessment_name} • {format(new Date(grade.assessment_date), "dd/MM/yyyy")}
                        </div>
                        {grade.comments && (
                          <div className="text-xs text-muted-foreground mt-1">{grade.comments}</div>
                        )}
                      </div>

                      <div className={cn("text-3xl font-bold", getGradeColor(parseFloat(grade.grade)))}>
                        {grade.grade}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(grade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Deseja realmente excluir esta nota?")) {
                              deleteMutation.mutate(grade.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma nota lançada
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Editar Nota" : "Lançar Nova Nota"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da avaliação e a nota do aluno
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingGrade && (
              <div>
                <Label>Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((enrollment: any) => (
                      <SelectItem key={enrollment.student_id} value={enrollment.student_id}>
                        {enrollment.student?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Matéria</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Matemática"
              />
            </div>

            <div>
              <Label>Tipo de Avaliação</Label>
              <Select
                value={formData.assessment_type}
                onValueChange={(value: any) => setFormData({ ...formData, assessment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prova">Prova</SelectItem>
                  <SelectItem value="trabalho">Trabalho</SelectItem>
                  <SelectItem value="atividade">Atividade</SelectItem>
                  <SelectItem value="participacao">Participação</SelectItem>
                  <SelectItem value="projeto">Projeto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome da Avaliação</Label>
              <Input
                value={formData.assessment_name}
                onChange={(e) => setFormData({ ...formData, assessment_name: e.target.value })}
                placeholder="Ex: Prova Bimestral"
              />
            </div>

            <div>
              <Label>Nota (0-10)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>

            <div>
              <Label>Data da Avaliação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.assessment_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.assessment_date
                      ? format(formData.assessment_date, "PPP", { locale: ptBR })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.assessment_date}
                    onSelect={(date) => date && setFormData({ ...formData, assessment_date: date })}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Comentários sobre o desempenho..."
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
