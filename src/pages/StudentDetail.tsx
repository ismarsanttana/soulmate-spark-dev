import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EducacaoLayout } from "@/components/educacao/EducacaoLayout";
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, FileText } from "lucide-react";
import { useState } from "react";

const StudentDetailContent = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("painel");

  // Buscar informações do aluno
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Buscar matrícula do aluno
  const { data: enrollment } = useQuery({
    queryKey: ["student-enrollment", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          class:class_id(*)
        `)
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Buscar responsáveis
  const { data: responsibles = [] } = useQuery({
    queryKey: ["student-responsibles", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_relationship")
        .select(`
          *,
          parent:parent_user_id(id, email)
        `)
        .eq("student_id", studentId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const userIds = data.map(r => r.parent_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);
        
        return data.map(rel => ({
          ...rel,
          responsible: profiles?.find(p => p.id === rel.parent_user_id)
        }));
      }
      
      return data || [];
    },
    enabled: !!studentId,
  });

  // TODO: Migrar student_attendance para usar student_id ao invés de student_user_id
  // Buscar registro de presença
  const attendanceRecords: any[] = [];
  /* const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("attendance_date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  }); */

  if (studentLoading) {
    return (
      <EducacaoLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="text-center py-12">Carregando...</div>
      </EducacaoLayout>
    );
  }

  if (!student) {
    return (
      <EducacaoLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="text-center py-12">Aluno não encontrado</div>
      </EducacaoLayout>
    );
  }

  const attendanceStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === "presente").length,
    absent: attendanceRecords.filter(a => a.status === "ausente").length,
    justified: attendanceRecords.filter(a => a.status === "justificado").length,
  };

  const attendanceRate = attendanceStats.total > 0 
    ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)
    : "0.0";

  const getRelationshipLabel = (type: string) => {
    const labels: Record<string, string> = {
      pai: "Pai",
      mae: "Mãe",
      responsavel: "Responsável",
      tutor: "Tutor",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      presente: { variant: "default", label: "Presente" },
      ausente: { variant: "destructive", label: "Ausente" },
      justificado: { variant: "secondary", label: "Justificado" },
      atrasado: { variant: "outline", label: "Atrasado" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <EducacaoLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/edu")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{student.full_name}</h2>
            <p className="text-muted-foreground">
              Matrícula: {enrollment?.matricula || "N/A"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {attendanceStats.present} de {attendanceStats.total} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Turma Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enrollment?.class?.class_name || "Sem turma"}
              </div>
              <p className="text-xs text-muted-foreground">
                {enrollment?.class?.grade_level || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={enrollment?.status === "active" ? "default" : "secondary"}>
                {enrollment?.status === "active" ? "Matriculado" : "Inativo"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Ano: {enrollment?.school_year || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="responsibles">Responsáveis</TabsTrigger>
            <TabsTrigger value="attendance">Presença</TabsTrigger>
            <TabsTrigger value="grades">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                    <p className="text-base">{student.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPF</p>
                    <p className="text-base">{student.cpf || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                    <p className="text-base">
                      {student.birth_date 
                        ? new Date(student.birth_date).toLocaleDateString()
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                    <p className="text-base">{student.telefone || "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Acadêmicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Matrícula</p>
                    <p className="text-base font-mono">{enrollment?.matricula || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Turma</p>
                    <p className="text-base">{enrollment?.class?.class_name || "Não atribuído"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Série/Ano</p>
                    <p className="text-base">{enrollment?.class?.grade_level || enrollment?.grade_level || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Escola</p>
                    <p className="text-base">{enrollment?.class?.school_name || enrollment?.school_name || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsibles">
            <Card>
              <CardHeader>
                <CardTitle>Pais e Responsáveis</CardTitle>
                <CardDescription>Lista de pessoas responsáveis pelo aluno</CardDescription>
              </CardHeader>
              <CardContent>
                {responsibles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum responsável cadastrado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responsibles.map((rel: any) => (
                      <div key={rel.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{rel.responsible?.full_name}</p>
                              <Badge variant="outline">
                                {getRelationshipLabel(rel.relationship_type)}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {rel.responsible?.email && (
                                <p>Email: {rel.responsible.email}</p>
                              )}
                              {rel.responsible?.cpf && (
                                <p>CPF: {rel.responsible.cpf}</p>
                              )}
                              {rel.responsible?.phone && (
                                <p>Telefone: {rel.responsible.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Presença</CardTitle>
                <CardDescription>Últimos 30 dias de registro</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum registro de presença
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.attendance_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Boletim Escolar</CardTitle>
                <CardDescription>Notas e desempenho acadêmico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de notas em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EducacaoLayout>
  );
};

const StudentDetail = () => {
  return (
    <ProtectedRoute allowedRoles={["secretario", "professor"]}>
      <StudentDetailContent />
    </ProtectedRoute>
  );
};

export default StudentDetail;