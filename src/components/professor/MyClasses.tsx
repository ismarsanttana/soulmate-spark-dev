import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Calendar, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const MyClasses = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ["professor-classes-detailed", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("school_classes")
        .select(`
          *,
          enrollments:student_enrollments(count)
        `)
        .eq("teacher_user_id", user.id)
        .order("class_name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: students } = useQuery({
    queryKey: ["class-students", selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass?.id) return [];
      
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select(`
          id,
          matricula,
          student:profiles(
            id,
            full_name,
            avatar_url,
            birth_date
          )
        `)
        .eq("class_id", selectedClass.id)
        .eq("status", "active");
      
      if (error) throw error;
      return enrollments || [];
    },
    enabled: !!selectedClass?.id,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      inactive: "bg-gray-500",
      pending: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Minhas Turmas
          </CardTitle>
          <CardDescription>
            Gerencie e visualize informações sobre suas turmas
          </CardDescription>
        </CardHeader>
      </Card>

      {classes && classes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => (
            <Card key={cls.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{cls.class_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cls.grade_level} • {cls.shift} • {cls.school_year}
                    </p>
                    {cls.school_name && (
                      <p className="text-xs text-muted-foreground mt-1">{cls.school_name}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(cls.status)}>
                    {cls.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Alunos</div>
                      <div className="text-lg font-bold">
                        {cls.enrollments?.[0]?.count || 0}/{cls.max_students || 40}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Aulas/Sem</div>
                      <div className="text-lg font-bold">-</div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedClass(cls)}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma turma atribuída</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClass?.class_name}</DialogTitle>
            <DialogDescription>
              {selectedClass?.grade_level} • {selectedClass?.shift} • {selectedClass?.school_year}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Lista de Alunos</h4>
              {students && students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold shadow">
                        {enrollment.student?.full_name?.charAt(0) || "A"}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{enrollment.student?.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Matrícula: {enrollment.matricula}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-muted/20 rounded-lg text-center text-sm text-muted-foreground">
                  Nenhum aluno matriculado
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
