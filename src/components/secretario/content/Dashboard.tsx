import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface DashboardProps {
  secretariaSlug: string;
}

export function Dashboard({ secretariaSlug }: DashboardProps) {
  const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month" | "year">("week");
  
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

  const { data: chartData } = useQuery({
    queryKey: ["content-chart", secretariaSlug, chartPeriod],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      
      switch (chartPeriod) {
        case "day":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Buscar notícias
      const { data: newsData } = await supabase
        .from("news")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      // Buscar eventos
      const { data: eventsData } = await supabase
        .from("events")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      // Buscar stories
      const { data: storiesData } = await supabase
        .from("stories")
        .select("created_at")
        .eq("secretaria_slug", secretariaSlug)
        .gte("created_at", startDate.toISOString());

      // Agrupar por período
      const groupedData = new Map<string, { noticias: number; eventos: number; stories: number }>();

      const addToGroup = (date: string, type: "noticias" | "eventos" | "stories") => {
        const d = new Date(date);
        let key = "";
        
        if (chartPeriod === "day") {
          key = `${d.getHours()}h`;
        } else if (chartPeriod === "week") {
          const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          key = days[d.getDay()];
        } else if (chartPeriod === "month") {
          key = `${d.getDate()}/${d.getMonth() + 1}`;
        } else {
          const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          key = `${months[d.getMonth()]}/${d.getFullYear()}`;
        }

        const current = groupedData.get(key) || { noticias: 0, eventos: 0, stories: 0 };
        current[type]++;
        groupedData.set(key, current);
      };

      newsData?.forEach(item => addToGroup(item.created_at, "noticias"));
      eventsData?.forEach(item => addToGroup(item.created_at, "eventos"));
      storiesData?.forEach(item => addToGroup(item.created_at, "stories"));

      return Array.from(groupedData.entries()).map(([name, data]) => ({
        name,
        ...data,
      }));
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Painel Administrativo — Secretaria de Comunicação
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão geral das atividades e indicadores da secretaria
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3.5">
              <div className="ascom-kpi-icon blue">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-muted-foreground mb-1">
                  Funcionários Ativos
                </div>
                <div className="text-3xl font-extrabold">{stats?.employeeCount}</div>
                <div className="text-xs font-bold text-success mt-0.5">
                  estável este mês
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3.5">
              <div className="ascom-kpi-icon green">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-muted-foreground mb-1">
                  Folha de Pagamento (mês)
                </div>
                <div className="text-3xl font-extrabold">{formatCurrency(stats?.payrollTotal || 0)}</div>
                <div className="text-xs font-bold text-success mt-0.5">
                  estável
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3.5">
              <div className="ascom-kpi-icon purple">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-muted-foreground mb-1">
                  Gastos com Publicidade
                </div>
                <div className="text-3xl font-extrabold">{formatCurrency(stats?.totalExpenses || 0)}</div>
                <div className="text-xs font-bold text-muted-foreground mt-0.5">
                  acumulado
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3.5">
              <div className="ascom-kpi-icon orange">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-muted-foreground mb-1">
                  Solicitações Pendentes
                </div>
                <div className="text-3xl font-extrabold">{stats?.pendingRequests}</div>
                <div className="text-xs font-bold text-success mt-0.5">
                  aguardando resposta
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
            <CardDescription className="text-sm">Distribuição dos gastos com publicidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {Object.entries(stats?.expensesByCategory || {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum gasto registrado</p>
              ) : (
                Object.entries(stats?.expensesByCategory || {}).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-2.5 bg-muted rounded-xl border border-border">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <strong className="text-sm">{formatCurrency(amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Conteúdo Publicado</CardTitle>
                <CardDescription className="text-sm">Distribuição temporal das publicações</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={chartPeriod === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartPeriod("day")}
                >
                  Dia
                </Button>
                <Button
                  variant={chartPeriod === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartPeriod("week")}
                >
                  Semana
                </Button>
                <Button
                  variant={chartPeriod === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartPeriod("month")}
                >
                  Mês
                </Button>
                <Button
                  variant={chartPeriod === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartPeriod("year")}
                >
                  Ano
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                noticias: {
                  label: "Notícias",
                  color: "hsl(var(--chart-1))",
                },
                eventos: {
                  label: "Eventos",
                  color: "hsl(var(--chart-2))",
                },
                stories: {
                  label: "Stories",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="noticias" fill="var(--color-noticias)" />
                  <Bar dataKey="eventos" fill="var(--color-eventos)" />
                  <Bar dataKey="stories" fill="var(--color-stories)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
            <CardDescription className="text-sm">Resumo das atividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-muted rounded-xl border border-border">
                <span className="text-sm font-medium">Funcionários Ativos</span>
                <strong className="text-sm">{stats?.employeeCount}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-muted rounded-xl border border-border">
                <span className="text-sm font-medium">Solicitações Pendentes</span>
                <strong className="text-sm">{stats?.pendingRequests}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
