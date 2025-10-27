import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealTimeAttendanceProps {
  classId: string;
}

export function RealTimeAttendance({ classId }: RealTimeAttendanceProps) {
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["class-students-attendance", classId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          student:student_id(
            id,
            full_name
          )
        `)
        .eq("class_id", classId)
        .eq("status", "active");

      if (!enrollments) return [];

      const { data: attendanceRecords } = await supabase
        .from("student_attendance")
        .select("student_id, status, created_at")
        .eq("class_id", classId)
        .eq("attendance_date", today);

      const { data: entryLogs } = await supabase
        .from("student_entry_log")
        .select("student_id, timestamp, entry_type")
        .eq("entry_type", "entrada")
        .gte("timestamp", `${today}T00:00:00`)
        .lte("timestamp", `${today}T23:59:59`)
        .order("timestamp", { ascending: false });

      return enrollments.map((enrollment: any) => {
        const attendance = attendanceRecords?.find(
          (a: any) => a.student_id === enrollment.student_id
        );
        const entryLog = entryLogs?.find(
          (e: any) => e.student_id === enrollment.student_id
        );

        return {
          ...enrollment.student,
          status: attendance?.status || (entryLog ? "presente" : "ausente"),
          entryTime: entryLog?.timestamp,
          lastUpdate: attendance?.created_at || entryLog?.timestamp,
        };
      });
    },
    enabled: !!classId,
  });

  // Supabase Realtime
  useEffect(() => {
    if (!classId) return;

    const attendanceChannel = supabase
      .channel("attendance-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_attendance",
          filter: `class_id=eq.${classId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["class-students-attendance", classId] });
        }
      )
      .subscribe();

    const entryLogChannel = supabase
      .channel("entry-log-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_entry_log",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["class-students-attendance", classId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(entryLogChannel);
    };
  }, [classId, queryClient]);

  const filteredStudents = students.filter((student: any) => {
    if (filter === "all") return true;
    if (filter === "present") return student.status === "presente";
    if (filter === "absent") return student.status === "ausente" || !student.status;
    return true;
  });

  const presentCount = students.filter((s: any) => s.status === "presente").length;
  const absentCount = students.filter((s: any) => s.status === "ausente" || !s.status).length;
  const attendanceRate = students.length > 0 ? (presentCount / students.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Presença em Tempo Real</CardTitle>
            <CardDescription>
              Atualização automática via reconhecimento facial
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["class-students-attendance", classId] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total de Alunos</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <p className="text-xs text-green-700 dark:text-green-400 mb-1">Presentes</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{presentCount}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
            <p className="text-xs text-red-700 dark:text-red-400 mb-1">Ausentes</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{absentCount}</p>
          </div>
        </div>

        {/* Taxa de presença */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Taxa de Presença</span>
            <span className="text-sm text-muted-foreground">{attendanceRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Filtro */}
        <div className="mt-4">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({students.length})</SelectItem>
              <SelectItem value="present">Presentes ({presentCount})</SelectItem>
              <SelectItem value="absent">Ausentes ({absentCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando alunos...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum aluno encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student: any) => (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  student.status === "presente"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                }`}
              >
                <Avatar>
                  <AvatarImage src={student.avatar_url} />
                  <AvatarFallback>
                    {student.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-medium">{student.full_name}</p>
                  {student.entryTime && (
                    <p className="text-xs text-muted-foreground">
                      Entrada: {new Date(student.entryTime).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>

                <Badge
                  variant={student.status === "presente" ? "default" : "destructive"}
                  className="gap-1"
                >
                  {student.status === "presente" ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Presente
                    </>
                  ) : student.status === "ausente" ? (
                    <>
                      <XCircle className="h-3 w-3" />
                      Ausente
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      Aguardando
                    </>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
