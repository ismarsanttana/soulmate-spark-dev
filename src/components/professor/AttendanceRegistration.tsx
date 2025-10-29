import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, X, Clock, FileCheck2, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AttendanceStatus = "presente" | "ausente" | "justificado" | "atrasado";

export const AttendanceRegistration = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const queryClient = useQueryClient();

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

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["class-students-attendance", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select(`
          id,
          student_id,
          matricula,
          student:profiles(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("class_id", selectedClass)
        .eq("status", "active");
      
      if (error) throw error;
      return enrollments || [];
    },
    enabled: !!selectedClass,
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ["attendance-records", selectedClass, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data, error } = await supabase
        .from("student_attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("attendance_date", format(selectedDate, "yyyy-MM-dd"));
      
      if (error) throw error;
      
      // Populate attendanceData with existing records
      if (data && data.length > 0) {
        const records: Record<string, AttendanceStatus> = {};
        data.forEach(record => {
          records[record.student_id] = record.status as AttendanceStatus;
        });
        setAttendanceData(records);
      } else {
        setAttendanceData({});
      }
      
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClass || !user?.id || Object.keys(attendanceData).length === 0) {
        throw new Error("Dados insuficientes");
      }

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const records = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        attendance_date: dateStr,
        status,
        recorded_by: user.id,
      }));

      // Delete existing records for this date
      await supabase
        .from("student_attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("attendance_date", dateStr);

      // Insert new records
      const { error } = await supabase
        .from("student_attendance")
        .insert(records);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Presença registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar presença");
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "presente":
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case "ausente":
        return <X className="h-4 w-4 text-red-500" />;
      case "atrasado":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "justificado":
        return <FileCheck2 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "presente":
        return "bg-green-500";
      case "ausente":
        return "bg-red-500";
      case "atrasado":
        return "bg-yellow-500";
      case "justificado":
        return "bg-blue-500";
    }
  };

  const stats = students ? {
    total: students.length,
    presente: Object.values(attendanceData).filter(s => s === "presente").length,
    ausente: Object.values(attendanceData).filter(s => s === "ausente").length,
    atrasado: Object.values(attendanceData).filter(s => s === "atrasado").length,
    justificado: Object.values(attendanceData).filter(s => s === "justificado").length,
  } : { total: 0, presente: 0, ausente: 0, atrasado: 0, justificado: 0 };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Registro de Presença
          </CardTitle>
          <CardDescription>
            Faça a chamada diária dos alunos
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          <div className="grid gap-3 sm:grid-cols-5">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-green-200">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Presentes</div>
                <div className="text-2xl font-bold text-green-600">{stats.presente}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-red-200">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Ausentes</div>
                <div className="text-2xl font-bold text-red-600">{stats.ausente}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-yellow-200">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Atrasados</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.atrasado}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-blue-200">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Justificados</div>
                <div className="text-2xl font-bold text-blue-600">{stats.justificado}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              {loadingStudents ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : students && students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((enrollment: any) => {
                    const studentStatus = attendanceData[enrollment.student_id];
                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold shadow flex-shrink-0">
                          {enrollment.student?.full_name?.charAt(0) || "A"}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{enrollment.student?.full_name}</div>
                          <div className="text-xs text-muted-foreground">Mat: {enrollment.matricula}</div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={studentStatus === "presente" ? "default" : "outline"}
                            className={studentStatus === "presente" ? "bg-green-500 hover:bg-green-600" : ""}
                            onClick={() => handleStatusChange(enrollment.student_id, "presente")}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={studentStatus === "ausente" ? "default" : "outline"}
                            className={studentStatus === "ausente" ? "bg-red-500 hover:bg-red-600" : ""}
                            onClick={() => handleStatusChange(enrollment.student_id, "ausente")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={studentStatus === "atrasado" ? "default" : "outline"}
                            className={studentStatus === "atrasado" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                            onClick={() => handleStatusChange(enrollment.student_id, "atrasado")}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={studentStatus === "justificado" ? "default" : "outline"}
                            className={studentStatus === "justificado" ? "bg-blue-500 hover:bg-blue-600" : ""}
                            onClick={() => handleStatusChange(enrollment.student_id, "justificado")}
                          >
                            <FileCheck2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {studentStatus && (
                          <Badge className={getStatusColor(studentStatus)}>
                            {studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)}
                          </Badge>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-4">
                    <Button
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending || Object.keys(attendanceData).length === 0}
                      className="w-full"
                    >
                      {saveMutation.isPending ? "Salvando..." : "Salvar Presença"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum aluno matriculado nesta turma
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
