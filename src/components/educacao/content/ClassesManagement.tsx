import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClassesManagementProps {
  secretariaSlug: string;
}

export function ClassesManagement({ secretariaSlug }: ClassesManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    class_name: "",
    grade_level: "",
    school_year: new Date().getFullYear().toString(),
    school_name: "",
    shift: "matutino",
    max_students: 40,
    teacher_user_id: "",
  });

  const queryClient = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["school-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_classes")
        .select(`
          *,
          teacher:profiles(
            id,
            full_name
          )
        `)
        .eq("status", "active")
        .order("grade_level", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: professors = [] } = useQuery({
    queryKey: ["professors-list"],
    queryFn: async () => {
      // Busca usuários com role de professor
      const { data: professorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "professor");

      if (rolesError) throw rolesError;
      
      const professorIds = professorRoles?.map(r => r.user_id) || [];
      
      if (professorIds.length === 0) return [];

      // Busca perfis dos professores
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", professorIds)
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollmentCounts = {} } = useQuery({
    queryKey: ["class-enrollment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("class_id")
        .eq("status", "active");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((enrollment) => {
        if (enrollment.class_id) {
          counts[enrollment.class_id] = (counts[enrollment.class_id] || 0) + 1;
        }
      });

      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("school_classes").insert({
        ...data,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-classes"] });
      toast({ title: "Turma criada com sucesso!" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao criar turma", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("school_classes")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-classes"] });
      toast({ title: "Turma atualizada com sucesso!" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar turma", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("school_classes")
        .update({ status: "inactive" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-classes"] });
      toast({ title: "Turma inativada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao inativar turma", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      grade_level: classItem.grade_level,
      school_year: classItem.school_year,
      school_name: classItem.school_name || "",
      shift: classItem.shift,
      max_students: classItem.max_students,
      teacher_user_id: classItem.teacher_user_id || "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClass(null);
    setFormData({
      class_name: "",
      grade_level: "",
      school_year: new Date().getFullYear().toString(),
      school_name: "",
      shift: "matutino",
      max_students: 40,
      teacher_user_id: "",
    });
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      matutino: "Matutino",
      vespertino: "Vespertino",
      noturno: "Noturno",
      integral: "Integral",
    };
    return labels[shift] || shift;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Turmas</h2>
          <p className="text-muted-foreground">Crie e gerencie turmas escolares</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turmas Ativas</CardTitle>
          <CardDescription>Lista de todas as turmas cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma turma cadastrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem: any) => {
                  const studentCount = enrollmentCounts[classItem.id] || 0;
                  const isFull = studentCount >= classItem.max_students;

                  return (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.class_name}</TableCell>
                      <TableCell>{classItem.grade_level}</TableCell>
                      <TableCell>{classItem.school_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getShiftLabel(classItem.shift)}</Badge>
                      </TableCell>
                      <TableCell>
                        {classItem.teacher?.full_name || (
                          <span className="text-muted-foreground text-sm">Sem professor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className={isFull ? "text-destructive font-semibold" : ""}>
                            {studentCount}/{classItem.max_students}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{classItem.school_year}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(classItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(classItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Editar Turma" : "Nova Turma"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da turma
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class_name">Nome da Turma *</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="Ex: 1º Ano A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade_level">Série *</Label>
                <Input
                  id="grade_level"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  placeholder="Ex: 1º Ano"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_year">Ano Letivo *</Label>
                <Input
                  id="school_year"
                  value={formData.school_year}
                  onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                  placeholder="2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Turno *</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value) => setFormData({ ...formData, shift: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_name">Nome da Escola</Label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  placeholder="Ex: Escola Municipal..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_students">Máximo de Alunos *</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="teacher">Professor Responsável</Label>
                <Select
                  value={formData.teacher_user_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor (opcional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map((prof: any) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.full_name} ({prof.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco se ainda não houver professor atribuído
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingClass ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}