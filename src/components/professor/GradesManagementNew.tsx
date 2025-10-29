import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, Plus, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GradeEntryMode = "individual" | "batch";

export const GradesManagementNew = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [entryMode, setEntryMode] = useState<GradeEntryMode>("individual");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchGrades, setBatchGrades] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    assessment_type: "Prova" as string,
    period: "1º Bimestre" as string,
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

  // Buscar matérias que o professor leciona
  const { data: subjects } = useQuery({
    queryKey: ["professor-subjects", user?.id, selectedClass],
    queryFn: async () => {
      if (!user?.id || !selectedClass) return [];
      const { data, error } = await supabase
        .from("class_teachers")
        .select("subject")
        .eq("teacher_user_id", user.id)
        .eq("class_id", selectedClass);
      if (error) throw error;
      
      // Extrair subjects únicos
      const uniqueSubjects = [...new Set(data?.map(s => s.subject) || [])];
      return uniqueSubjects;
    },
    enabled: !!user?.id && !!selectedClass,
  });

  const { data: students } = useQuery({
    queryKey: ["class-students-grades", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select(`
          id,
          student_id,
          matricula,
          student:students(id, full_name)
        `)
        .eq("class_id", selectedClass)
        .eq("status", "active");
      if (error) throw error;
      return enrollments || [];
    },
    enabled: !!selectedClass,
  });

  const { data: grades, isLoading } = useQuery({
    queryKey: ["student-grades-list", selectedClass, selectedStudent, selectedSubject],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      let query = supabase
        .from("student_grades")
        .select(`
          *,
          student:students(full_name)
        `)
        .eq("class_id", selectedClass)
        .order("assessment_date", { ascending: false });

      if (selectedStudent && selectedStudent !== "all") {
        query = query.eq("student_id", selectedStudent);
      }

      if (selectedSubject && selectedSubject !== "all") {
        query = query.eq("subject", selectedSubject);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const saveIndividualMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedStudent || !selectedSubject) {
        throw new Error("Dados incompletos");
      }

      const gradeValue = parseFloat(formData.grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
        throw new Error("Nota deve ser entre 0 e 10");
      }

      const { error } = await supabase
        .from("student_grades")
        .insert({
          student_id: selectedStudent,
          class_id: selectedClass,
          subject: selectedSubject,
          period: formData.period,
          grade: gradeValue,
          assessment_type: formData.assessment_type,
          assessment_date: format(formData.assessment_date, "yyyy-MM-dd"),
          teacher_id: user.id,
          comments: formData.comments,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota lançada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["student-grades-list"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || "Erro ao salvar nota");
    },
  });

  const saveBatchMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedSubject) {
        throw new Error("Dados incompletos");
      }

      const records = Object.entries(batchGrades)
        .filter(([_, grade]) => grade && grade.trim() !== "")
        .map(([studentId, grade]) => {
          const gradeValue = parseFloat(grade);
          if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
            throw new Error(`Nota inválida para um dos alunos: ${grade}`);
          }

          return {
            student_id: studentId,
            class_id: selectedClass,
            subject: selectedSubject,
            period: formData.period,
            grade: gradeValue,
            assessment_type: formData.assessment_type,
            assessment_date: format(formData.assessment_date, "yyyy-MM-dd"),
            teacher_id: user.id,
            comments: formData.comments,
          };
        });

      if (records.length === 0) {
        throw new Error("Adicione pelo menos uma nota");
      }

      const { error } = await supabase
        .from("student_grades")
        .insert(records);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notas lançadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["student-grades-list"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || "Erro ao salvar notas");
    },
  });

  const handleOpenDialog = (mode: GradeEntryMode) => {
    setEntryMode(mode);
    setBatchGrades({});
    setFormData({
      assessment_type: "Prova",
      period: "1º Bimestre",
      grade: "",
      assessment_date: new Date(),
      comments: "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setBatchGrades({});
  };

  const handleSubmit = () => {
    if (entryMode === "individual") {
      saveIndividualMutation.mutate();
    } else {
      saveBatchMutation.mutate();
    }
  };

  const handleBatchGradeChange = (studentId: string, grade: string) => {
    setBatchGrades(prev => ({
      ...prev,
      [studentId]: grade,
    }));
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return "text-green-600";
    if (grade >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateAverage = () => {
    if (!grades || grades.length === 0) return "-";
    const sum = grades.reduce((acc: number, g: any) => acc + parseFloat(g.grade), 0);
    return (sum / grades.length).toFixed(1);
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
            <div className="flex gap-2">
              <Button
                onClick={() => handleOpenDialog("individual")}
                disabled={!selectedClass}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nota Individual
              </Button>
              <Button
                onClick={() => handleOpenDialog("batch")}
                disabled={!selectedClass}
              >
                <Users className="h-4 w-4 mr-2" />
                Lançar por Turma
              </Button>
            </div>
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

            {selectedClass && subjects && subjects.length > 0 && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filtrar por matéria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as matérias</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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
                      className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{grade.student?.full_name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {grade.subject}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {grade.assessment_type} • {grade.period} • {format(new Date(grade.assessment_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        {grade.comments && (
                          <div className="text-xs text-muted-foreground mt-1">{grade.comments}</div>
                        )}
                      </div>

                      <div className={cn("text-3xl font-bold", getGradeColor(parseFloat(grade.grade)))}>
                        {parseFloat(grade.grade).toFixed(1)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {entryMode === "individual" ? "Lançar Nota Individual" : "Lançar Notas por Turma"}
            </DialogTitle>
            <DialogDescription>
              {entryMode === "individual" 
                ? "Preencha os dados da avaliação e a nota do aluno"
                : "Adicione notas para múltiplos alunos de uma vez"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {entryMode === "individual" && (
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
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Período</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1º Bimestre">1º Bimestre</SelectItem>
                    <SelectItem value="2º Bimestre">2º Bimestre</SelectItem>
                    <SelectItem value="3º Bimestre">3º Bimestre</SelectItem>
                    <SelectItem value="4º Bimestre">4º Bimestre</SelectItem>
                    <SelectItem value="1º Trimestre">1º Trimestre</SelectItem>
                    <SelectItem value="2º Trimestre">2º Trimestre</SelectItem>
                    <SelectItem value="3º Trimestre">3º Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Avaliação</Label>
                <Select
                  value={formData.assessment_type}
                  onValueChange={(value) => setFormData({ ...formData, assessment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prova">Prova</SelectItem>
                    <SelectItem value="Trabalho">Trabalho</SelectItem>
                    <SelectItem value="Atividade">Atividade</SelectItem>
                    <SelectItem value="Participação">Participação</SelectItem>
                    <SelectItem value="Projeto">Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            {entryMode === "individual" ? (
              <div>
                <Label>Nota (0-10)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="Ex: 8.5"
                />
              </div>
            ) : (
              <div>
                <Label>Notas dos Alunos</Label>
                <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                  {students?.map((enrollment: any) => (
                    <div key={enrollment.student_id} className="flex items-center gap-3">
                      <div className="flex-1 text-sm">{enrollment.student?.full_name}</div>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={batchGrades[enrollment.student_id] || ""}
                        onChange={(e) => handleBatchGradeChange(enrollment.student_id, e.target.value)}
                        placeholder="Nota"
                        className="w-24"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Comentários sobre a avaliação..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saveIndividualMutation.isPending || saveBatchMutation.isPending}
            >
              {(saveIndividualMutation.isPending || saveBatchMutation.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
