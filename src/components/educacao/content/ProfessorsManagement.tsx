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
import { Plus, Pencil, Trash2, BookOpen, GraduationCap, UserPlus, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProfessorsManagementProps {
  secretariaSlug: string;
}

export function ProfessorsManagement({ secretariaSlug }: ProfessorsManagementProps) {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [classFormData, setClassFormData] = useState({ class_id: "", subject: "" });
  const [teacherFormData, setTeacherFormData] = useState({
    full_name: "",
    cpf: "",
    email: "",
    telefone: "",
    carga_horaria_semanal: 40,
    banco_horas: 0,
    especialidade: "",
    formacao: "",
    registro_profissional: "",
    data_admissao: "",
    situacao: "ativo",
    observacoes: ""
  });

  // Fetch teachers (users with professor role) with teacher data
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

      // Fetch teacher-specific data
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .in("user_id", teacherIds);

      if (teachersError) throw teachersError;

      // Merge profile and teacher data
      return profiles?.map(profile => {
        const teacherData = teachersData?.find(t => t.user_id === profile.id);
        return { ...profile, ...teacherData };
      }) || [];
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

  // Create/Update teacher mutation
  const saveTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!selectedTeacher?.id;

      if (isEditing) {
        // Update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            cpf: data.cpf,
            email: data.email,
            telefone: data.telefone,
          })
          .eq("id", selectedTeacher.id);

        if (profileError) throw profileError;

        // Update or insert teacher data
        const { error: teacherError } = await supabase
          .from("teachers")
          .upsert({
            user_id: selectedTeacher.id,
            carga_horaria_semanal: data.carga_horaria_semanal,
            banco_horas: data.banco_horas,
            especialidade: data.especialidade,
            formacao: data.formacao,
            registro_profissional: data.registro_profissional,
            data_admissao: data.data_admissao || null,
            situacao: data.situacao,
            observacoes: data.observacoes,
          });

        if (teacherError) throw teacherError;
      } else {
        // Create new user and profile
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          user_metadata: {
            full_name: data.full_name,
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar usuário");

        // Insert profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: data.full_name,
            cpf: data.cpf,
            email: data.email,
            telefone: data.telefone,
          });

        if (profileError) throw profileError;

        // Insert professor role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "professor",
          });

        if (roleError) throw roleError;

        // Insert teacher data
        const { error: teacherError } = await supabase
          .from("teachers")
          .insert({
            user_id: authData.user.id,
            carga_horaria_semanal: data.carga_horaria_semanal,
            banco_horas: data.banco_horas,
            especialidade: data.especialidade,
            formacao: data.formacao,
            registro_profissional: data.registro_profissional,
            data_admissao: data.data_admissao || null,
            situacao: data.situacao,
            observacoes: data.observacoes,
          });

        if (teacherError) throw teacherError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professors-list"] });
      toast.success(selectedTeacher ? "Professor atualizado!" : "Professor criado!");
      setEditDialogOpen(false);
      resetTeacherForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar professor: " + error.message);
    },
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remove professor role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "professor");

      if (roleError) throw roleError;

      // Delete teacher data (will cascade)
      const { error: teacherError } = await supabase
        .from("teachers")
        .delete()
        .eq("user_id", userId);

      if (teacherError) throw teacherError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professors-list"] });
      toast.success("Professor removido!");
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao remover professor: " + error.message);
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

  const resetTeacherForm = () => {
    setTeacherFormData({
      full_name: "",
      cpf: "",
      email: "",
      telefone: "",
      carga_horaria_semanal: 40,
      banco_horas: 0,
      especialidade: "",
      formacao: "",
      registro_profissional: "",
      data_admissao: "",
      situacao: "ativo",
      observacoes: ""
    });
    setSelectedTeacher(null);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setTeacherFormData({
      full_name: teacher.full_name || "",
      cpf: teacher.cpf || "",
      email: teacher.email || "",
      telefone: teacher.telefone || "",
      carga_horaria_semanal: teacher.carga_horaria_semanal || 40,
      banco_horas: teacher.banco_horas || 0,
      especialidade: teacher.especialidade || "",
      formacao: teacher.formacao || "",
      registro_profissional: teacher.registro_profissional || "",
      data_admissao: teacher.data_admissao || "",
      situacao: teacher.situacao || "ativo",
      observacoes: teacher.observacoes || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveTeacher = () => {
    if (!teacherFormData.full_name || !teacherFormData.email) {
      toast.error("Preencha pelo menos nome e email");
      return;
    }

    saveTeacherMutation.mutate(teacherFormData);
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
        <Button onClick={() => { resetTeacherForm(); setEditDialogOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Professor
        </Button>
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
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Banco de Horas</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.full_name}</TableCell>
                    <TableCell>{teacher.cpf || "—"}</TableCell>
                    <TableCell>{teacher.email || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {teacher.carga_horaria_semanal || 40}h/sem
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.banco_horas > 0 ? "default" : teacher.banco_horas < 0 ? "destructive" : "secondary"}>
                        {teacher.banco_horas || 0}h
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.situacao === "ativo" ? "default" : "secondary"}>
                        {teacher.situacao || "ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setClassDialogOpen(true);
                          }}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

      {/* Dialog for creating/editing teacher */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTeacher ? "Editar Professor" : "Adicionar Professor"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do professor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={teacherFormData.full_name}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={teacherFormData.cpf}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, cpf: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={teacherFormData.email}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                  disabled={!!selectedTeacher}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={teacherFormData.telefone}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, telefone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carga_horaria">Carga Horária Semanal</Label>
                <Input
                  id="carga_horaria"
                  type="number"
                  value={teacherFormData.carga_horaria_semanal}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, carga_horaria_semanal: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco_horas">Banco de Horas</Label>
                <Input
                  id="banco_horas"
                  type="number"
                  value={teacherFormData.banco_horas}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, banco_horas: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="situacao">Situação</Label>
                <Select
                  value={teacherFormData.situacao}
                  onValueChange={(value) => setTeacherFormData({ ...teacherFormData, situacao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={teacherFormData.especialidade}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, especialidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formacao">Formação</Label>
                <Input
                  id="formacao"
                  value={teacherFormData.formacao}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, formacao: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registro">Registro Profissional</Label>
                <Input
                  id="registro"
                  value={teacherFormData.registro_profissional}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, registro_profissional: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={teacherFormData.data_admissao}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, data_admissao: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={3}
                value={teacherFormData.observacoes}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, observacoes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTeacher} disabled={saveTeacherMutation.isPending}>
              {saveTeacherMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o professor {selectedTeacher?.full_name}? 
              Esta ação removerá o papel de professor do usuário e seus dados específicos.
              As turmas atribuídas a este professor também serão desvinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTeacher && deleteTeacherMutation.mutate(selectedTeacher.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
