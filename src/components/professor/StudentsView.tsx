import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export const StudentsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const navigate = useNavigate();

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
        .select("id, class_name")
        .eq("teacher_user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["professor-students", classes?.map(c => c.id), selectedClass],
    queryFn: async () => {
      if (!classes || classes.length === 0) return [];
      
      const classIds = selectedClass === "all" 
        ? classes.map(c => c.id)
        : [selectedClass];
      
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select(`
          id,
          matricula,
          class_id,
          class:school_classes(class_name),
          student:students(
            id,
            full_name,
            birth_date,
            telefone
          )
        `)
        .in("class_id", classIds)
        .eq("status", "active");
      
      if (error) throw error;
      return enrollments || [];
    },
    enabled: !!classes && classes.length > 0,
  });

  const filteredStudents = students?.filter((enrollment: any) =>
    enrollment.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.matricula?.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Alunos
          </CardTitle>
          <CardDescription>
            Visualize os alunos das suas turmas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudents && filteredStudents.length > 0 ? (
        <div className="space-y-3">
          {filteredStudents.map((enrollment: any) => (
            <Card key={enrollment.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {enrollment.student?.full_name?.charAt(0) || "A"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{enrollment.student?.full_name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {enrollment.class?.class_name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Mat: {enrollment.matricula}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/aluno/${enrollment.student?.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum aluno encontrado" : "Nenhum aluno matriculado"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
