import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School, TrendingUp, DollarSign, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardTabProps {
  secretariaSlug: string;
}

export default function DashboardTab({ secretariaSlug }: DashboardTabProps) {
  const { data: schools, isLoading: loadingSchools } = useQuery({
    queryKey: ["schools-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: idebAvg, isLoading: loadingIdeb } = useQuery({
    queryKey: ["ideb-average"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ideb_data")
        .select("nota_anos_iniciais, nota_anos_finais")
        .eq("ano", 2023);
      
      if (!data || data.length === 0) return null;
      
      const notas = data.flatMap(d => [d.nota_anos_iniciais, d.nota_anos_finais]).filter(Boolean);
      return notas.length > 0 
        ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)
        : null;
    },
  });

  const { data: budget, isLoading: loadingBudget } = useQuery({
    queryKey: ["budget-summary"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orcamento_educacao")
        .select("valor_realizado")
        .eq("ano", new Date().getFullYear())
        .eq("tipo", "receita");
      
      if (!data) return 0;
      return data.reduce((sum, item) => sum + (parseFloat(item.valor_realizado?.toString() || "0") || 0), 0);
    },
  });

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    isLoading 
  }: { 
    title: string; 
    value: string | number | null; 
    icon: any; 
    isLoading: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? "N/A"}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Escolas"
          value={schools}
          icon={School}
          isLoading={loadingSchools}
        />
        <MetricCard
          title="Total de Alunos"
          value={students}
          icon={Users}
          isLoading={loadingStudents}
        />
        <MetricCard
          title="IDEB Médio 2023"
          value={idebAvg}
          icon={TrendingUp}
          isLoading={loadingIdeb}
        />
        <MetricCard
          title="Orçamento Realizado"
          value={budget ? `R$ ${(budget / 1000000).toFixed(1)}M` : "N/A"}
          icon={DollarSign}
          isLoading={loadingBudget}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este dashboard consolida informações de múltiplas fontes de dados do governo federal.
            Utilize as abas acima para explorar dados específicos de cada fonte.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm"><strong>Censo Escolar:</strong> Dados do INEP sobre escolas e matrículas</p>
            <p className="text-sm"><strong>IDEB & Avaliações:</strong> Indicadores de qualidade educacional</p>
            <p className="text-sm"><strong>Orçamento:</strong> Execução orçamentária da função educação</p>
            <p className="text-sm"><strong>SICONFI:</strong> Dados fiscais do Tesouro Nacional</p>
            <p className="text-sm"><strong>Transparência:</strong> Transferências federais (FUNDEB, PDDE, etc)</p>
            <p className="text-sm"><strong>Dados Abertos:</strong> Catálogo completo do dados.gov.br</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}