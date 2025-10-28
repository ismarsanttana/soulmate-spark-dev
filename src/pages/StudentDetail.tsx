import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EducacaoLayout } from "@/components/educacao/EducacaoLayout";
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, FileText, Edit, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const StudentDetailContent = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("painel");
  const [editStudentDialog, setEditStudentDialog] = useState(false);
  const [editResponsibleDialog, setEditResponsibleDialog] = useState(false);
  const [selectedResponsible, setSelectedResponsible] = useState<any>(null);
  
  const [studentFormData, setStudentFormData] = useState({
    full_name: "",
    cpf: "",
    birth_date: "",
    telefone: "",
    rg: "",
    naturalidade: "",
    nacionalidade: "Brasileira",
  });

  const [responsibleFormData, setResponsibleFormData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    telefone: "",
    endereco_completo: "",
    relationship_type: "pai",
  });

  const [searchCpf, setSearchCpf] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();

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

  // Buscar registro de presença
  const { data: attendanceRecords = [] } = useQuery({
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
  });

  // Buscar notas do aluno
  const { data: grades = [] } = useQuery({
    queryKey: ["student-grades", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_grades")
        .select("*")
        .eq("student_id", studentId)
        .order("assessment_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

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

  // Mutation para atualizar dados do aluno
  const updateStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("students")
        .update(data)
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-detail"] });
      toast.success("Dados do aluno atualizados com sucesso!");
      setEditStudentDialog(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar dados do aluno");
    },
  });

  // Mutation para adicionar/atualizar responsável
  const saveResponsibleMutation = useMutation({
    mutationFn: async () => {
      let responsibleUserId: string;

      // Verificar se já existe um usuário com este email ou CPF
      const { data: existingUserByEmail } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", responsibleFormData.email)
        .maybeSingle();

      const { data: existingUserByCpf } = responsibleFormData.cpf ? await supabase
        .from("profiles")
        .select("id, email")
        .eq("cpf", responsibleFormData.cpf)
        .maybeSingle() : { data: null };

      const existingUser = existingUserByEmail || existingUserByCpf;

      if (existingUser) {
        // Usuário já existe, apenas atualizar dados
        responsibleUserId = existingUser.id;
        await supabase
          .from("profiles")
          .update({
            full_name: responsibleFormData.full_name,
            cpf: responsibleFormData.cpf,
            telefone: responsibleFormData.telefone,
            endereco_completo: responsibleFormData.endereco_completo,
          })
          .eq("id", responsibleUserId);

        // Garantir que tenha o role de pai
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", responsibleUserId)
          .eq("role", "pai")
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert([{ 
            user_id: responsibleUserId, 
            role: "pai" 
          }]);
        }
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: responsibleFormData.email,
          password: Math.random().toString(36).slice(-12) + "Aa1!",
          options: { 
            data: { full_name: responsibleFormData.full_name },
            emailRedirectTo: `${window.location.origin}/`
          },
        });
        
        if (authError) throw authError;
        if (!authData?.user) throw new Error("Erro ao criar responsável");
        
        responsibleUserId = authData.user.id;

        await supabase.from("profiles").update({
          full_name: responsibleFormData.full_name,
          cpf: responsibleFormData.cpf,
          telefone: responsibleFormData.telefone,
          endereco_completo: responsibleFormData.endereco_completo,
        }).eq("id", responsibleUserId);

        await supabase.from("user_roles").insert([{ 
          user_id: responsibleUserId, 
          role: "pai" 
        }]);
      }

      if (selectedResponsible) {
        // Atualizar relacionamento existente
        await supabase
          .from("parent_student_relationship")
          .update({
            relationship_type: responsibleFormData.relationship_type,
          })
          .eq("id", selectedResponsible.id);
      } else {
        // Verificar se já existe relacionamento entre este responsável e o aluno
        const { data: existingRelationship } = await supabase
          .from("parent_student_relationship")
          .select("id")
          .eq("parent_user_id", responsibleUserId)
          .eq("student_id", studentId)
          .maybeSingle();

        if (existingRelationship) {
          // Atualizar relacionamento existente
          await supabase
            .from("parent_student_relationship")
            .update({
              relationship_type: responsibleFormData.relationship_type,
            })
            .eq("id", existingRelationship.id);
        } else {
          // Criar novo relacionamento
          await supabase.from("parent_student_relationship").insert({
            parent_user_id: responsibleUserId,
            student_id: studentId,
            relationship_type: responsibleFormData.relationship_type,
            is_primary: true,
            is_authorized_pickup: true,
            can_view_grades: true,
            can_view_attendance: true,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-responsibles"] });
      toast.success("Responsável salvo com sucesso!");
      setEditResponsibleDialog(false);
      setSelectedResponsible(null);
      setSearchCpf("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar responsável");
    },
  });

  const handleEditStudent = () => {
    if (!student) return;
    setStudentFormData({
      full_name: student.full_name || "",
      cpf: student.cpf || "",
      birth_date: student.birth_date || "",
      telefone: student.telefone || "",
      rg: student.rg || "",
      naturalidade: student.naturalidade || "",
      nacionalidade: student.nacionalidade || "Brasileira",
    });
    setEditStudentDialog(true);
  };

  const handleAddResponsible = () => {
    setSelectedResponsible(null);
    setSearchCpf("");
    setResponsibleFormData({
      full_name: "",
      email: "",
      cpf: "",
      telefone: "",
      endereco_completo: "",
      relationship_type: "pai",
    });
    setEditResponsibleDialog(true);
  };

  const handleEditResponsible = (responsible: any) => {
    setSelectedResponsible(responsible);
    setResponsibleFormData({
      full_name: responsible.responsible?.full_name || "",
      email: responsible.responsible?.email || "",
      cpf: responsible.responsible?.cpf || "",
      telefone: responsible.responsible?.telefone || "",
      endereco_completo: responsible.responsible?.endereco_completo || "",
      relationship_type: responsible.relationship_type || "pai",
    });
    setEditResponsibleDialog(true);
  };

  const handleSearchByCpf = async () => {
    if (!searchCpf || searchCpf.length < 11) {
      toast.error("Digite um CPF válido para buscar");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_profile_by_cpf", {
        _cpf: searchCpf,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const profile = data[0];
        setResponsibleFormData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          cpf: profile.cpf || "",
          telefone: profile.telefone || "",
          endereco_completo: profile.endereco_completo || "",
          relationship_type: responsibleFormData.relationship_type,
        });
        toast.success("Responsável encontrado! Dados preenchidos automaticamente.");
      } else {
        toast.info("CPF não encontrado. Preencha os dados para criar um novo cadastro.");
        setResponsibleFormData({
          ...responsibleFormData,
          cpf: searchCpf,
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar responsável:", error);
      toast.error(error.message || "Erro ao buscar responsável");
    } finally {
      setIsSearching(false);
    }
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dados Pessoais</CardTitle>
                <Button variant="outline" size="sm" onClick={handleEditStudent}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pais e Responsáveis</CardTitle>
                  <CardDescription>Lista de pessoas responsáveis pelo aluno</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddResponsible}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
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
                              {rel.responsible?.telefone && (
                                <p>Telefone: {rel.responsible.telefone}</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditResponsible(rel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                {grades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma nota lançada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Agrupar notas por período */}
                    {Array.from(new Set(grades.map(g => g.period))).map(period => {
                      const periodGrades = grades.filter(g => g.period === period);
                      const subjects = Array.from(new Set(periodGrades.map(g => g.subject)));
                      
                      return (
                        <div key={period}>
                          <h3 className="text-lg font-semibold mb-4">{period}</h3>
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Disciplina</TableHead>
                                  <TableHead className="text-center">Prova 1</TableHead>
                                  <TableHead className="text-center">Prova 2</TableHead>
                                  <TableHead className="text-center">Trabalho</TableHead>
                                  <TableHead className="text-center">Participação</TableHead>
                                  <TableHead className="text-center font-bold">Média</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subjects.map(subject => {
                                  const subjectGrades = periodGrades.filter(g => g.subject === subject);
                                  const prova1 = subjectGrades.find(g => g.assessment_type === 'Prova 1')?.grade || 0;
                                  const prova2 = subjectGrades.find(g => g.assessment_type === 'Prova 2')?.grade || 0;
                                  const trabalho = subjectGrades.find(g => g.assessment_type === 'Trabalho')?.grade || 0;
                                  const participacao = subjectGrades.find(g => g.assessment_type === 'Participação')?.grade || 0;
                                  
                                  const media = ((Number(prova1) + Number(prova2) + Number(trabalho) + Number(participacao)) / 4).toFixed(2);
                                  const isApproved = Number(media) >= 7.0;
                                  
                                  return (
                                    <TableRow key={subject}>
                                      <TableCell className="font-medium">{subject}</TableCell>
                                      <TableCell className="text-center">{Number(prova1).toFixed(2)}</TableCell>
                                      <TableCell className="text-center">{Number(prova2).toFixed(2)}</TableCell>
                                      <TableCell className="text-center">{Number(trabalho).toFixed(2)}</TableCell>
                                      <TableCell className="text-center">{Number(participacao).toFixed(2)}</TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant={isApproved ? "default" : "destructive"}>
                                          {media}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {/* Média geral do período */}
                          <div className="mt-4 flex justify-end">
                            <div className="bg-muted rounded-lg p-4">
                              <p className="text-sm text-muted-foreground">Média Geral do Período</p>
                              <p className="text-2xl font-bold">
                                {(() => {
                                  const allSubjectAverages = subjects.map(subject => {
                                    const subjectGrades = periodGrades.filter(g => g.subject === subject);
                                    const sum = subjectGrades.reduce((acc, g) => acc + Number(g.grade), 0);
                                    return sum / subjectGrades.length;
                                  });
                                  const periodAverage = (allSubjectAverages.reduce((a, b) => a + b, 0) / allSubjectAverages.length).toFixed(2);
                                  return periodAverage;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para editar dados do aluno */}
        <Dialog open={editStudentDialog} onOpenChange={setEditStudentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Dados do Aluno</DialogTitle>
              <DialogDescription>Atualize as informações pessoais do aluno</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={studentFormData.full_name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={studentFormData.cpf}
                  onChange={(e) => setStudentFormData({ ...studentFormData, cpf: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={studentFormData.birth_date}
                  onChange={(e) => setStudentFormData({ ...studentFormData, birth_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={studentFormData.telefone}
                  onChange={(e) => setStudentFormData({ ...studentFormData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={studentFormData.rg}
                  onChange={(e) => setStudentFormData({ ...studentFormData, rg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="naturalidade">Naturalidade</Label>
                <Input
                  id="naturalidade"
                  value={studentFormData.naturalidade}
                  onChange={(e) => setStudentFormData({ ...studentFormData, naturalidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nacionalidade">Nacionalidade</Label>
                <Input
                  id="nacionalidade"
                  value={studentFormData.nacionalidade}
                  onChange={(e) => setStudentFormData({ ...studentFormData, nacionalidade: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditStudentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => updateStudentMutation.mutate(studentFormData)}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para adicionar/editar responsável */}
        <Dialog open={editResponsibleDialog} onOpenChange={setEditResponsibleDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedResponsible ? "Editar Responsável" : "Adicionar Responsável"}
              </DialogTitle>
              <DialogDescription>
                {selectedResponsible 
                  ? "Atualize as informações do responsável" 
                  : "Cadastre um novo responsável para o aluno"}
              </DialogDescription>
            </DialogHeader>
            
            {!selectedResponsible && (
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <Label htmlFor="search_cpf" className="text-sm font-medium">
                  Buscar Responsável por CPF
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="search_cpf"
                    placeholder="Digite o CPF (somente números)"
                    value={searchCpf}
                    onChange={(e) => setSearchCpf(e.target.value.replace(/\D/g, ""))}
                    maxLength={11}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleSearchByCpf}
                    disabled={isSearching || searchCpf.length < 11}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se o responsável já estiver cadastrado no sistema, seus dados serão preenchidos automaticamente.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="resp_full_name">Nome Completo *</Label>
                <Input
                  id="resp_full_name"
                  value={responsibleFormData.full_name}
                  onChange={(e) => setResponsibleFormData({ ...responsibleFormData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp_email">Email *</Label>
                <Input
                  id="resp_email"
                  type="email"
                  value={responsibleFormData.email}
                  onChange={(e) => setResponsibleFormData({ ...responsibleFormData, email: e.target.value })}
                  required
                  disabled={!!selectedResponsible}
                />
                {selectedResponsible && (
                  <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp_cpf">CPF</Label>
                <Input
                  id="resp_cpf"
                  value={responsibleFormData.cpf}
                  onChange={(e) => setResponsibleFormData({ ...responsibleFormData, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp_telefone">Telefone</Label>
                <Input
                  id="resp_telefone"
                  value={responsibleFormData.telefone}
                  onChange={(e) => setResponsibleFormData({ ...responsibleFormData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship_type">Tipo de Relacionamento *</Label>
                <Select
                  value={responsibleFormData.relationship_type}
                  onValueChange={(value) => setResponsibleFormData({ ...responsibleFormData, relationship_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pai">Pai</SelectItem>
                    <SelectItem value="mae">Mãe</SelectItem>
                    <SelectItem value="responsavel">Responsável</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="resp_endereco">Endereço Completo</Label>
                <Input
                  id="resp_endereco"
                  value={responsibleFormData.endereco_completo}
                  onChange={(e) => setResponsibleFormData({ ...responsibleFormData, endereco_completo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditResponsibleDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => saveResponsibleMutation.mutate()}>
                {selectedResponsible ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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