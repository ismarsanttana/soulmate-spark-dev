import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, TrendingUp, UserCheck, Clock } from "lucide-react";

interface DashboardProps {
  secretariaSlug: string;
}

export function Dashboard({ secretariaSlug }: DashboardProps) {
  // Buscar funcionários
  const { data: employees = [] } = useQuery({
    queryKey: ["dashboard-employees", secretariaSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_employees")
        .select("*")
        .eq("secretaria_slug", secretariaSlug)
        .eq("situacao", "ativo");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar matrículas ativas
  const { data: enrollments = [] } = useQuery({
    queryKey: ["dashboard-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("*")
        .eq("status", "active");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar solicitações pendentes
  const { data: pendingRequests = 0 } = useQuery({
    queryKey: ["dashboard-pending-requests", secretariaSlug],
    queryFn: async () => {
      const { count } = await supabase
        .from("secretary_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_secretary_slug", secretariaSlug)
        .eq("status", "pendente");
      
      return count || 0;
    },
  });

  // Calcular folha de pagamento
  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + (parseFloat(emp.salario?.toString() || "0") || 0);
  }, 0);

  // Contar alunos únicos (relacionados com matrículas)
  const uniqueStudents = new Set(enrollments.map(e => e.student_user_id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Painel da Secretaria de Educação</h2>
        <p className="text-muted-foreground">Visão geral das atividades da secretaria</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Equipe da secretaria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha de Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Matriculados</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">
              {enrollments.length} matrículas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Alunos por Série</CardTitle>
            <CardDescription>Visão geral das matrículas por nível</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma matrícula registrada
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  enrollments.reduce((acc, enrollment) => {
                    const level = enrollment.grade_level || "Não informado";
                    acc[level] = (acc[level] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{level}</span>
                    <span className="text-sm text-muted-foreground">{count} alunos</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo da Equipe</CardTitle>
            <CardDescription>Distribuição por função</CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum funcionário cadastrado
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  employees.reduce((acc, emp) => {
                    const funcao = emp.funcao || "Não informado";
                    acc[funcao] = (acc[funcao] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).slice(0, 5).map(([funcao, count]) => (
                  <div key={funcao} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{funcao}</span>
                    <span className="text-sm text-muted-foreground">{count} funcionários</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
