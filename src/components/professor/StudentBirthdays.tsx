import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Cake, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterType = "month" | "week" | "day";

export const StudentBirthdays = () => {
  const [filterType, setFilterType] = useState<FilterType>("month");
  const [currentDate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Buscar turmas do professor
  const { data: classes } = useQuery({
    queryKey: ["professor-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("school_classes")
        .select("id, class_name")
        .eq("teacher_user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Buscar alunos das turmas do professor
  const { data: students, isLoading } = useQuery({
    queryKey: ["professor-students-birthdays", classes?.map(c => c.id)],
    queryFn: async () => {
      if (!classes || classes.length === 0) return [];
      
      const classIds = classes.map(c => c.id);
      
      // Buscar matrículas dos alunos
      const { data: enrollments, error: enrollError } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .in("class_id", classIds)
        .eq("status", "active");
      
      if (enrollError) throw enrollError;
      
      const studentIds = [...new Set(enrollments?.map(e => e.student_id) || [])];
      
      if (studentIds.length === 0) return [];
      
      // Buscar dados dos alunos da tabela students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, birth_date")
        .in("id", studentIds)
        .not("birth_date", "is", null);
      
      if (studentsError) throw studentsError;
      
      return studentsData || [];
    },
    enabled: !!classes && classes.length > 0,
  });

  const getFilteredStudents = () => {
    if (!students) return [];

    const today = new Date();
    
    return students.filter(student => {
      if (!student.birth_date) return false;
      
      const birthDate = new Date(student.birth_date);
      // Ajustar para o ano atual para comparação
      const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      
      switch (filterType) {
        case "day":
          return isSameDay(birthdayThisYear, today);
          
        case "week":
          const weekStart = startOfWeek(today, { locale: ptBR });
          const weekEnd = endOfWeek(today, { locale: ptBR });
          return isWithinInterval(birthdayThisYear, { start: weekStart, end: weekEnd });
          
        case "month":
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          return isWithinInterval(birthdayThisYear, { start: monthStart, end: monthEnd });
          
        default:
          return false;
      }
    }).sort((a, b) => {
      const dateA = new Date(a.birth_date!);
      const dateB = new Date(b.birth_date!);
      return dateA.getDate() - dateB.getDate();
    });
  };

  const filteredStudents = getFilteredStudents();

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "day": return "Hoje";
      case "week": return "Esta Semana";
      case "month": return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-primary" />
                Aniversários dos Alunos
              </CardTitle>
              <CardDescription>
                Visualize os aniversariantes das suas turmas
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                size="sm"
                variant={filterType === "day" ? "default" : "outline"}
                onClick={() => setFilterType("day")}
              >
                Hoje
              </Button>
              <Button
                size="sm"
                variant={filterType === "week" ? "default" : "outline"}
                onClick={() => setFilterType("week")}
              >
                Semana
              </Button>
              <Button
                size="sm"
                variant={filterType === "month" ? "default" : "outline"}
                onClick={() => setFilterType("month")}
              >
                Mês
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm capitalize">
              Aniversários: {getFilterLabel()}
            </span>
            <Badge variant="secondary" className="ml-auto">
              {filteredStudents.length} {filteredStudents.length === 1 ? "aluno" : "alunos"}
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const birthDate = new Date(student.birth_date!);
                const age = getAge(student.birth_date!);
                const today = new Date();
                const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                const isToday = isSameDay(birthdayThisYear, today);
                
                return (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isToday
                        ? "bg-primary/10 border-primary/30 shadow-sm"
                        : "bg-card border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-md">
                        <Cake className="h-6 w-6" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm truncate">{student.full_name}</h4>
                        {isToday && (
                          <Badge className="bg-primary text-white">
                            🎉 Hoje!
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(birthDate, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span>•</span>
                        <span>Fará {age + 1} anos</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-primary">
                        {format(birthDate, "dd")}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(birthDate, "MMM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-muted/20 border border-border rounded-xl text-center">
              <Cake className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum aniversário encontrado {filterType === "day" ? "hoje" : filterType === "week" ? "nesta semana" : "neste mês"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
