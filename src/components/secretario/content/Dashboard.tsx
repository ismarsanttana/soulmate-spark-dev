import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  secretariaSlug: string;
}

export function Dashboard({ secretariaSlug }: DashboardProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["secretary-dashboard", secretariaSlug],
    queryFn: async () => {
      // Buscar quantidade de funcionários
      const { count: employeeCount } = await supabase
        .from("secretaria_employees")
        .select("*", { count: "exact", head: true })
        .eq("secretaria_slug", secretariaSlug)
        .eq("situacao", "ativo");

      // Buscar folha de pagamento
      const { data: employees } = await supabase
        .from("secretaria_employees")
        .select("salario")
        .eq("secretaria_slug", secretariaSlug)
        .eq("situacao", "ativo");

      const payrollTotal = employees?.reduce((sum, emp) => {
        return sum + (parseFloat(emp.salario as any) || 0);
      }, 0) || 0;

      // Buscar gastos com publicidade por categoria
      const { data: expenses } = await supabase
        .from("advertising_expenses")
        .select("category, amount")
        .eq("secretaria_slug", secretariaSlug);

      const expensesByCategory = expenses?.reduce((acc, exp) => {
        if (!acc[exp.category]) {
          acc[exp.category] = 0;
        }
        acc[exp.category] += parseFloat(exp.amount as any) || 0;
        return acc;
      }, {} as Record<string, number>) || {};

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

      // Buscar outras estatísticas
      const { count: newsCount } = await supabase
        .from("news")
        .select("*", { count: "exact", head: true });

      const { count: storiesCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("secretaria_slug", secretariaSlug);

      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      const { count: pendingRequests } = await supabase
        .from("secretary_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_secretary_slug", secretariaSlug)
        .eq("status", "pendente");

      return {
        employeeCount: employeeCount || 0,
        payrollTotal,
        expensesByCategory,
        totalExpenses,
        newsCount: newsCount || 0,
        storiesCount: storiesCount || 0,
        eventsCount: eventsCount || 0,
        pendingRequests: pendingRequests || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral das atividades da Secretaria de Comunicação
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employeeCount}</div>
            <p className="text-xs text-muted-foreground">Ativos na secretaria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha de Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.payrollTotal || 0)}</div>
            <p className="text-xs text-muted-foreground">Total mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos com Publicidade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalExpenses || 0)}</div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>Distribuição dos gastos com publicidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.expensesByCategory || {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum gasto registrado</p>
              ) : (
                Object.entries(stats?.expensesByCategory || {}).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo Publicado</CardTitle>
            <CardDescription>Resumo de publicações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notícias</span>
                <span className="text-sm text-muted-foreground">{stats?.newsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stories</span>
                <span className="text-sm text-muted-foreground">{stats?.storiesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Eventos</span>
                <span className="text-sm text-muted-foreground">{stats?.eventsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações na secretaria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Funcionários Ativos</span>
                <span className="text-sm text-muted-foreground">{stats?.employeeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Solicitações Pendentes</span>
                <span className="text-sm text-muted-foreground">{stats?.pendingRequests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
