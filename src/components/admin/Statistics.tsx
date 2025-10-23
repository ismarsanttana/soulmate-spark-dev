import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, Bell, Building2, Shield } from "lucide-react";

export function Statistics() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: appointmentsCount },
        { count: protocolsCount },
        { count: newsCount },
        { count: eventsCount },
        { count: secretariasCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("ombudsman_protocols").select("*", { count: "exact", head: true }),
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("secretarias").select("*", { count: "exact", head: true }),
      ]);

      return {
        users: usersCount || 0,
        appointments: appointmentsCount || 0,
        protocols: protocolsCount || 0,
        news: newsCount || 0,
        events: eventsCount || 0,
        secretarias: secretariasCount || 0,
      };
    },
  });

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats?.users || 0,
      icon: Users,
      description: "Usuários cadastrados no sistema",
    },
    {
      title: "Secretarias",
      value: stats?.secretarias || 0,
      icon: Building2,
      description: "Secretarias cadastradas",
    },
    {
      title: "Agendamentos",
      value: stats?.appointments || 0,
      icon: Calendar,
      description: "Total de agendamentos realizados",
    },
    {
      title: "Protocolos",
      value: stats?.protocols || 0,
      icon: Shield,
      description: "Protocolos da ouvidoria",
    },
    {
      title: "Notícias",
      value: stats?.news || 0,
      icon: FileText,
      description: "Notícias publicadas",
    },
    {
      title: "Eventos",
      value: stats?.events || 0,
      icon: Calendar,
      description: "Eventos cadastrados",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estatísticas do Sistema</h2>
        <p className="text-muted-foreground">Visão geral dos dados do portal</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-accent/50 rounded-lg">
              <span className="font-medium">Taxa de Engajamento</span>
              <span className="text-2xl font-bold text-primary">
                {stats ? Math.round((stats.appointments / Math.max(stats.users, 1)) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-accent/50 rounded-lg">
              <span className="font-medium">Média de Agendamentos por Usuário</span>
              <span className="text-2xl font-bold text-primary">
                {stats ? (stats.appointments / Math.max(stats.users, 1)).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-accent/50 rounded-lg">
              <span className="font-medium">Conteúdo Publicado</span>
              <span className="text-2xl font-bold text-primary">
                {stats ? stats.news + stats.events : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
