import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Edit, GraduationCap } from "lucide-react";

interface EnrollmentsManagementProps {
  secretariaSlug: string;
}

interface EnrollmentWithProfile {
  id: string;
  student_user_id: string;
  matricula: string;
  school_name: string | null;
  grade_level: string | null;
  class_name: string | null;
  school_year: string | null;
  status: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  attendance: any;
  grades: any;
  metadata: any;
  student_profile?: {
    id: string;
    full_name: string;
    email: string | null;
  };
}

export function EnrollmentsManagement({ secretariaSlug }: EnrollmentsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [formData, setFormData] = useState({
    student_user_id: "",
    matricula: "",
    school_name: "",
    grade_level: "",
    class_name: "",
    school_year: new Date().getFullYear().toString(),
    status: "active"
  });
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading } = useQuery<EnrollmentWithProfile[]>({
    queryKey: ["student-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Buscar dados dos estudantes separadamente
      if (data && data.length > 0) {
        const userIds = data.map(e => e.student_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        
        // Combinar os dados
        return data.map(enrollment => ({
          ...enrollment,
          student_profile: profiles?.find(p => p.id === enrollment.student_user_id)
        }));
      }
      
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("student_enrollments")
        .insert({ ...data, created_by: user?.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      toast.success("Matrícula criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar matrícula: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("student_enrollments")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      toast.success("Matrícula atualizada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar matrícula: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      student_user_id: "",
      matricula: "",
      school_name: "",
      grade_level: "",
      class_name: "",
      school_year: new Date().getFullYear().toString(),
      status: "active"
    });
    setSelectedEnrollment(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEnrollment) {
      updateMutation.mutate({ id: selectedEnrollment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setFormData({
      student_user_id: enrollment.student_user_id,
      matricula: enrollment.matricula,
      school_name: enrollment.school_name || "",
      grade_level: enrollment.grade_level || "",
      class_name: enrollment.class_name || "",
      school_year: enrollment.school_year || new Date().getFullYear().toString(),
      status: enrollment.status || "active"
    });
    setIsDialogOpen(true);
  };

  const filteredEnrollments = enrollments?.filter(
    (enrollment) =>
      enrollment.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Gerenciamento de Matrículas
            </CardTitle>
            <CardDescription>
              Gerencie todas as matrículas dos alunos
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Matrícula
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedEnrollment ? "Editar Matrícula" : "Nova Matrícula"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da matrícula do aluno
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Número da Matrícula *</Label>
                    <Input
                      id="matricula"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_year">Ano Letivo *</Label>
                    <Input
                      id="school_year"
                      value={formData.school_year}
                      onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_name">Escola</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade_level">Série</Label>
                    <Input
                      id="grade_level"
                      value={formData.grade_level}
                      onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                      placeholder="Ex: 1º Ano, 5ª Série"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class_name">Turma</Label>
                    <Input
                      id="class_name"
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      placeholder="Ex: A, B, Manhã"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="transferred">Transferido</SelectItem>
                      <SelectItem value="graduated">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedEnrollment ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por matrícula, aluno ou escola..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando matrículas...
          </div>
        ) : filteredEnrollments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma matrícula encontrada
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments?.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-mono">{enrollment.matricula}</TableCell>
                    <TableCell className="font-medium">
                      {enrollment.student_profile?.full_name || "Não informado"}
                    </TableCell>
                    <TableCell>{enrollment.school_name || "-"}</TableCell>
                    <TableCell>{enrollment.grade_level || "-"}</TableCell>
                    <TableCell>{enrollment.class_name || "-"}</TableCell>
                    <TableCell>{enrollment.school_year}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                        {enrollment.status === "active" ? "Ativo" : 
                         enrollment.status === "inactive" ? "Inativo" :
                         enrollment.status === "transferred" ? "Transferido" : "Concluído"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(enrollment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
