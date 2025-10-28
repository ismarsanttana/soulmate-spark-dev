import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface StudentsManagementCompleteProps {
  secretariaSlug: string;
}

export function StudentsManagementComplete({ secretariaSlug }: StudentsManagementCompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const navigate = useNavigate();

  // Buscar turmas
  const { data: classes = [] } = useQuery({
    queryKey: ["school-classes-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_classes")
        .select("*")
        .eq("status", "active")
        .order("grade_level", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar matrículas com informações do aluno
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["student-enrollments-complete", selectedClass],
    queryFn: async () => {
      let query = supabase
        .from("student_enrollments")
        .select(`
          *,
          student:student_id(id, full_name, cpf, birth_date),
          class:class_id(id, class_name, grade_level, school_name)
        `)
        .eq("status", "active");

      if (selectedClass && selectedClass !== "all") {
        query = query.eq("class_id", selectedClass);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar relacionamentos (pais/responsáveis)
  const { data: relationships = [] } = useQuery({
    queryKey: ["student-relationships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_relationship")
        .select("*");

      if (error) throw error;
      
      // Buscar dados dos responsáveis (profiles) e estudantes separadamente
      if (data && data.length > 0) {
        const userIds = data.map(r => r.parent_user_id);
        const studentIds = data.map(r => r.student_id);
        
        const [profilesResult, studentsResult] = await Promise.all([
          supabase.from("profiles").select("*").in("id", userIds),
          supabase.from("students").select("id, full_name").in("id", studentIds)
        ]);
        
        return data.map(rel => ({
          ...rel,
          responsible: profilesResult.data?.find(p => p.id === rel.parent_user_id),
          student: studentsResult.data?.find(s => s.id === rel.student_id)
        }));
      }
      
      return data || [];
    },
  });

  // Filtrar alunos baseado na busca
  const filteredEnrollments = enrollments.filter((enrollment: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const studentName = enrollment.student?.full_name?.toLowerCase() || "";
    const matricula = enrollment.matricula?.toLowerCase() || "";
    const className = enrollment.class?.class_name?.toLowerCase() || "";
    
    return (
      studentName.includes(searchLower) ||
      matricula.includes(searchLower) ||
      className.includes(searchLower)
    );
  });

  const getResponsible = (studentId: string) => {
    const rel = relationships.find((r: any) => r.student_id === studentId);
    return (rel as any)?.responsible?.full_name || "Não cadastrado";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Alunos</h2>
        <p className="text-muted-foreground">Visualize e gerencie os alunos matriculados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os alunos por turma ou busque por nome/matrícula</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do aluno ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-filter">Filtrar por Turma</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes.map((classItem: any) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.class_name} - {classItem.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos Matriculados ({filteredEnrollments.length})</CardTitle>
          <CardDescription>Lista de todos os alunos cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedClass !== "all"
                ? "Nenhum aluno encontrado com os filtros selecionados"
                : "Nenhum aluno matriculado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome do Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment: any) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-mono text-sm">
                      {enrollment.matricula}
                    </TableCell>
                    <TableCell className="font-medium">
                      {enrollment.student?.full_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {enrollment.class?.class_name || "Sem turma"}
                    </TableCell>
                    <TableCell>
                      {enrollment.class?.grade_level || enrollment.grade_level || "N/A"}
                    </TableCell>
                    <TableCell>{getResponsible(enrollment.student_id)}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                        {enrollment.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/edu/aluno/${enrollment.student_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}