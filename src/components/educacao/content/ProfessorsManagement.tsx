import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, GraduationCap } from "lucide-react";

interface ProfessorsManagementProps {
  secretariaSlug: string;
}

export function ProfessorsManagement({ secretariaSlug }: ProfessorsManagementProps) {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [classFormData, setClassFormData] = useState({ class_id: "", subject: "" });

  // Fetch teachers (users with professor role)
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["professors-list"],
    queryFn: async () => {
      const { data: teacherRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "professor");

      if (rolesError) throw rolesError;

      const teacherIds = teacherRoles.map(r => r.user_id);

      if (teacherIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", teacherIds);

      if (profilesError) throw profilesError;

      return profiles || [];
    },
  });

  // Fetch all classes
  const { data: classes = [] } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_classes")
        .select("*")
        .eq("status", "active")
        .order("class_name");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch class assignments for a teacher
  const { data: teacherClasses = [] } = useQuery({
    queryKey: ["teacher-classes", selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher?.id) return [];

      const { data, error } = await supabase
        .from("class_teachers")
        .select(`
          *,
          school_classes (
            id,
            class_name,
            grade_level,
            school_year
          )
        `)
        .eq("teacher_user_id", selectedTeacher.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTeacher?.id,
  });

  // Add class to teacher mutation
  const addClassMutation = useMutation({
    mutationFn: async (data: { class_id: string; teacher_user_id: string; subject: string }) => {
      const { error } = await supabase
        .from("class_teachers")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      toast.success("Turma adicionada ao professor!");
      setClassDialogOpen(false);
      setClassFormData({ class_id: "", subject: "" });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Este professor já está atribuído a esta turma com esta disciplina");
      } else {
        toast.error("Erro ao adicionar turma: " + error.message);
      }
    },
  });

  // Remove class from teacher mutation
  const removeClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      toast.success("Turma removida do professor!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover turma: " + error.message);
    },
  });

  const handleAddClass = () => {
    if (!classFormData.class_id || !classFormData.subject) {
      toast.error("Preencha todos os campos");
      return;
    }

    addClassMutation.mutate({
      class_id: classFormData.class_id,
      teacher_user_id: selectedTeacher.id,
      subject: classFormData.subject,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ascom-page-header">
        <div>
          <h1 className="ascom-page-title">Gerenciar Professores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e gerencie professores e suas turmas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Professores Cadastrados
          </CardTitle>
          <CardDescription>
            Lista de todos os professores do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum professor cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.full_name}</TableCell>
                    <TableCell>{teacher.cpf || "—"}</TableCell>
                    <TableCell>{teacher.email || "—"}</TableCell>
                    <TableCell>{teacher.telefone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setClassDialogOpen(true);
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Turmas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog for managing teacher classes */}
      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Turmas de {selectedTeacher?.full_name}
            </DialogTitle>
            <DialogDescription>
              Adicione ou remova turmas e disciplinas do professor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current classes */}
            <div>
              <h3 className="font-semibold mb-3">Turmas Atuais</h3>
              {teacherClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma turma atribuída
                </p>
              ) : (
                <div className="space-y-2">
                  {teacherClasses.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {assignment.school_classes?.class_name} - {assignment.school_classes?.grade_level}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Disciplina: {assignment.subject}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClassMutation.mutate(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new class */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Adicionar Nova Turma</h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Turma</Label>
                  <Select
                    value={classFormData.class_id}
                    onValueChange={(value) =>
                      setClassFormData({ ...classFormData, class_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} - {cls.grade_level} ({cls.school_year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Disciplina</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Matemática, Português, etc."
                    value={classFormData.subject}
                    onChange={(e) =>
                      setClassFormData({ ...classFormData, subject: e.target.value })
                    }
                  />
                </div>

                <Button onClick={handleAddClass} disabled={addClassMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Turma
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
