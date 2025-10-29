import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Calendar, CheckCircle, XCircle, FileText, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudentDetailDialogProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentDetailDialog = ({ studentId, open, onOpenChange }: StudentDetailDialogProps) => {
  // Buscar informações do aluno
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId && open,
  });

  // Buscar matrícula do aluno
  const { data: enrollment } = useQuery({
    queryKey: ["student-enrollment", studentId],
    queryFn: async () => {
      if (!studentId) return null;
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
    enabled: !!studentId && open,
  });

  // Buscar responsáveis
  const { data: responsibles = [] } = useQuery({
    queryKey: ["student-responsibles", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("parent_student_relationship")
        .select("*")
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
    enabled: !!studentId && open,
  });

  // Buscar registro de presença
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("attendance_date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && open,
  });

  // Buscar notas do aluno
  const { data: grades = [] } = useQuery({
    queryKey: ["student-grades", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_grades")
        .select("*")
        .eq("student_id", studentId)
        .order("assessment_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && open,
  });

  // Calcular estatísticas de frequência
  const attendanceStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === 'presente').length,
    absent: attendanceRecords.filter(r => r.status === 'falta').length,
    late: attendanceRecords.filter(r => r.status === 'atrasado').length,
  };

  const attendanceRate = attendanceStats.total > 0 
    ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)
    : '0';

  // Calcular média geral
  const averageGrade = grades.length > 0
    ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(1)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Aluno
          </DialogTitle>
          <DialogDescription>
            Visualize informações completas do aluno, incluindo presença, notas e responsáveis
          </DialogDescription>
        </DialogHeader>

        {studentLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
          </div>
        ) : student ? (
          <Tabs defaultValue="painel" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="painel">Painel</TabsTrigger>
              <TabsTrigger value="presenca">Presença</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                      <p className="text-base">{student.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                      <p className="text-base">
                        {student.birth_date ? format(new Date(student.birth_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CPF</label>
                      <p className="text-base">{student.cpf || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">RG</label>
                      <p className="text-base">{student.rg || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <p className="text-base">{student.telefone || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Matrícula</label>
                      <p className="text-base">{enrollment?.matricula || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Frequência
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{attendanceRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attendanceStats.present} presentes de {attendanceStats.total} aulas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-4 w-4" />
                      Média Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{averageGrade}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {grades.length} avaliações registradas
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="presenca" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Registro de Presença (últimos 30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {format(new Date(record.attendance_date), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {record.status === 'presente' && (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Presente
                                </Badge>
                              )}
                              {record.status === 'falta' && (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Falta
                                </Badge>
                              )}
                              {record.status === 'atrasado' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Atrasado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhum registro de presença encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notas e Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.length > 0 ? (
                        grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">{grade.subject}</TableCell>
                            <TableCell>{grade.period}</TableCell>
                            <TableCell>
                              <Badge variant={grade.grade >= 7 ? "default" : "destructive"}>
                                {grade.grade?.toFixed(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{grade.assessment_type}</TableCell>
                            <TableCell>
                              {grade.assessment_date ? 
                                format(new Date(grade.assessment_date), "dd/MM/yyyy", { locale: ptBR }) : 
                                "-"
                              }
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhuma nota registrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responsaveis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Responsáveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {responsibles.length > 0 ? (
                      responsibles.map((rel: any) => (
                        <Card key={rel.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{rel.responsible?.full_name || "Nome não disponível"}</h4>
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  <p><strong>Parentesco:</strong> {rel.relationship_type}</p>
                                  <p><strong>Email:</strong> {rel.responsible?.email || "-"}</p>
                                  <p><strong>Telefone:</strong> {rel.responsible?.telefone || "-"}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {rel.is_primary && <Badge variant="default">Principal</Badge>}
                                {rel.is_authorized_pickup && <Badge variant="secondary">Autorizado Buscar</Badge>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum responsável cadastrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aluno não encontrado
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
