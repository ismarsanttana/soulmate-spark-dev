import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ValidacaoTabProps {
  secretariaSlug: string;
}

export default function ValidacaoTab({ secretariaSlug }: ValidacaoTabProps) {
  const { data: validation, isLoading } = useQuery({
    queryKey: ["educacenso-validation"],
    queryFn: async () => {
      // Alunos sem raça/cor
      const { data: studentsWithoutRace, count: countRace } = await supabase
        .from("students")
        .select("id, full_name", { count: "exact" })
        .is("raca_cor", null)
        .limit(10);

      // Turmas sem escola
      const { data: classesWithoutSchool, count: countClasses } = await supabase
        .from("school_classes")
        .select("id, class_name", { count: "exact" })
        .is("school_id", null)
        .eq("status", "active")
        .limit(10);

      // Alunos sem data de nascimento
      const { data: studentsWithoutBirth, count: countBirth } = await supabase
        .from("students")
        .select("id, full_name", { count: "exact" })
        .is("birth_date", null)
        .limit(10);

      // Turmas sem professor
      const { data: classesWithoutTeacher, count: countTeacher } = await supabase
        .from("school_classes")
        .select("id, class_name", { count: "exact" })
        .is("teacher_user_id", null)
        .eq("status", "active")
        .limit(10);

      return {
        studentsWithoutRace: { data: studentsWithoutRace || [], count: countRace || 0 },
        classesWithoutSchool: { data: classesWithoutSchool || [], count: countClasses || 0 },
        studentsWithoutBirth: { data: studentsWithoutBirth || [], count: countBirth || 0 },
        classesWithoutTeacher: { data: classesWithoutTeacher || [], count: countTeacher || 0 },
      };
    },
  });

  const ValidationCard = ({ 
    title, 
    count, 
    description 
  }: { 
    title: string; 
    count: number; 
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {count > 0 ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {count > 0 && (
          <Badge variant="destructive" className="mt-2">
            Requer atenção
          </Badge>
        )}
        {count === 0 && (
          <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
            OK
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">Carregando validações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Validação Educacenso</h3>
        <p className="text-sm text-muted-foreground">
          Verificação de campos obrigatórios para o Censo Escolar
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ValidationCard
          title="Alunos sem Raça/Cor"
          count={validation?.studentsWithoutRace?.count || 0}
          description="Campo obrigatório para o Educacenso"
        />
        
        <ValidationCard
          title="Turmas sem Escola"
          count={validation?.classesWithoutSchool?.count || 0}
          description="Vincule as turmas às escolas cadastradas"
        />

        <ValidationCard
          title="Alunos sem Data de Nascimento"
          count={validation?.studentsWithoutBirth?.count || 0}
          description="Informação obrigatória para matrícula"
        />

        <ValidationCard
          title="Turmas sem Professor"
          count={validation?.classesWithoutTeacher?.count || 0}
          description="Atribua professores às turmas ativas"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da Validação</CardTitle>
          <CardDescription>
            Status geral dos dados para o Censo Escolar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validation && Object.values(validation).every((v: any) => v.count === 0) ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">
                Todos os dados estão completos e prontos para o Educacenso!
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">
                  Existem pendências que precisam ser resolvidas antes do envio do Censo.
                </p>
                <p className="text-sm mt-1">
                  Corrija os itens marcados acima para garantir a conformidade com o Educacenso.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}