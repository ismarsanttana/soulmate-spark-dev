import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FileText, Users, Award, CheckSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type ReportType = "attendance" | "grades" | "general" | "student";

export const Reports = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("general");

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
    queryKey: ["class-students-reports", selectedClass],
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

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["report-data", selectedClass, selectedStudent, reportType],
    queryFn: async () => {
      if (!selectedClass) return null;

      const selectedClassData = classes?.find(c => c.id === selectedClass);

      // Fetch students
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          student:profiles(full_name)
        `)
        .eq("class_id", selectedClass)
        .eq("status", "active");

      // Fetch attendance
      const { data: attendance } = await supabase
        .from("student_attendance" as any)
        .select("*")
        .eq("class_id", selectedClass);

      // Fetch grades
      const { data: grades } = await supabase
        .from("student_grades" as any)
        .select("*")
        .eq("class_id", selectedClass);

      return {
        class: selectedClassData,
        enrollments,
        attendance,
        grades,
      };
    },
    enabled: !!selectedClass,
  });

  const generatePDF = () => {
    if (!reportData) {
      toast.error("Nenhum dado disponível para gerar relatório");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.text("Relatório Escolar", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Turma: ${reportData.class?.class_name || ""}`, 20, yPos);
    yPos += 7;
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 20, yPos);
    yPos += 15;

    // Statistics
    doc.setFontSize(14);
    doc.text("Estatísticas Gerais", 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    const totalStudents = reportData.enrollments?.length || 0;
    const totalAttendance = reportData.attendance?.length || 0;
    const totalGrades = reportData.grades?.length || 0;

    doc.text(`Total de Alunos: ${totalStudents}`, 25, yPos);
    yPos += 7;
    doc.text(`Registros de Presença: ${totalAttendance}`, 25, yPos);
    yPos += 7;
    doc.text(`Notas Lançadas: ${totalGrades}`, 25, yPos);
    yPos += 15;

    // Attendance Summary
    if (reportData.attendance && reportData.attendance.length > 0) {
      doc.setFontSize(14);
      doc.text("Resumo de Frequência", 20, yPos);
      yPos += 10;

      const presente = reportData.attendance.filter((a: any) => a.status === "presente").length;
      const ausente = reportData.attendance.filter((a: any) => a.status === "ausente").length;
      const atrasado = reportData.attendance.filter((a: any) => a.status === "atrasado").length;

      doc.setFontSize(11);
      doc.text(`Presentes: ${presente} (${((presente / totalAttendance) * 100).toFixed(1)}%)`, 25, yPos);
      yPos += 7;
      doc.text(`Ausentes: ${ausente} (${((ausente / totalAttendance) * 100).toFixed(1)}%)`, 25, yPos);
      yPos += 7;
      doc.text(`Atrasados: ${atrasado} (${((atrasado / totalAttendance) * 100).toFixed(1)}%)`, 25, yPos);
      yPos += 15;
    }

    // Grades Summary
    if (reportData.grades && reportData.grades.length > 0) {
      doc.setFontSize(14);
      doc.text("Resumo de Notas", 20, yPos);
      yPos += 10;

      const gradesArray = reportData.grades.map((g: any) => parseFloat(g.grade));
      const average = (gradesArray.reduce((a: number, b: number) => a + b, 0) / gradesArray.length).toFixed(2);
      const highest = Math.max(...gradesArray).toFixed(2);
      const lowest = Math.min(...gradesArray).toFixed(2);

      doc.setFontSize(11);
      doc.text(`Média Geral: ${average}`, 25, yPos);
      yPos += 7;
      doc.text(`Maior Nota: ${highest}`, 25, yPos);
      yPos += 7;
      doc.text(`Menor Nota: ${lowest}`, 25, yPos);
    }

    // Save PDF
    const fileName = `relatorio_${reportData.class?.class_name}_${format(new Date(), "dd-MM-yyyy")}.pdf`;
    doc.save(fileName);
    toast.success("Relatório gerado com sucesso!");
  };

  const calculateStats = () => {
    if (!reportData) return null;

    const totalStudents = reportData.enrollments?.length || 0;
    const totalAttendance = reportData.attendance?.length || 0;
    const presente = reportData.attendance?.filter((a: any) => a.status === "presente").length || 0;
    const attendanceRate = totalAttendance > 0 ? ((presente / totalAttendance) * 100).toFixed(1) : "0";

    const gradesArray = reportData.grades?.map((g: any) => parseFloat(g.grade)) || [];
    const avgGrade = gradesArray.length > 0
      ? (gradesArray.reduce((a, b) => a + b, 0) / gradesArray.length).toFixed(2)
      : "-";

    return {
      totalStudents,
      totalAttendance,
      attendanceRate,
      avgGrade,
      totalGrades: reportData.grades?.length || 0,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Relatórios
          </CardTitle>
          <CardDescription>
            Gere relatórios detalhados de desempenho e frequência
          </CardDescription>
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

            <Select value={reportType} onValueChange={(v: ReportType) => setReportType(v)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="attendance">Frequência</SelectItem>
                <SelectItem value="grades">Notas</SelectItem>
                <SelectItem value="student">Por Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "student" && selectedClass && (
            <div className="mt-3">
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
        </CardContent>
      </Card>

      {selectedClass && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Alunos</div>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckSquare className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Frequência Média</div>
                    <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Média Geral</div>
                    <div className="text-2xl font-bold">{stats.avgGrade}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Notas Lançadas</div>
                    <div className="text-2xl font-bold">{stats.totalGrades}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Relatório em PDF</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gere um relatório completo em PDF com todas as informações da turma
                  </p>
                  <Button onClick={generatePDF} disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
