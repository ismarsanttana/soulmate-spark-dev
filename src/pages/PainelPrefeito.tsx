import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, Bell, Calendar } from "lucide-react";

const PainelPrefeitoContent = () => {
  const { data: stats } = useQuery({
    queryKey: ["prefeito-stats"],
    queryFn: async () => {
      const [
        appointmentsResult,
        protocolsResult,
        usersResult,
        notificationsResult,
        eventsResult,
      ] = await Promise.all([
        supabase.from("appointments").select("id, status", { count: "exact" }),
        supabase.from("ombudsman_protocols").select("id, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("notifications").select("id", { count: "exact" }),
        supabase.from("events").select("id", { count: "exact" }),
      ]);

      const appointmentsPending = appointmentsResult.data?.filter(
        (a) => a.status === "pendente"
      ).length || 0;
      
      const appointmentsConcluded = appointmentsResult.data?.filter(
        (a) => a.status === "confirmado"
      ).length || 0;

      const protocolsOpen = protocolsResult.data?.filter(
        (p) => p.status === "aberto"
      ).length || 0;
      
      const protocolsClosed = protocolsResult.data?.filter(
        (p) => p.status === "encerrado"
      ).length || 0;

      return {
        totalUsers: usersResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        appointmentsPending,
        appointmentsConcluded,
        totalProtocols: protocolsResult.count || 0,
        protocolsOpen,
        protocolsClosed,
        totalNotifications: notificationsResult.count || 0,
        totalEvents: eventsResult.count || 0,
      };
    },
  });

  const cards = [
    {
      title: "Usuários Cadastrados",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Total de cidadãos no app",
      color: "text-blue-600",
    },
    {
      title: "Consultas Agendadas",
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      description: `${stats?.appointmentsPending || 0} pendentes, ${stats?.appointmentsConcluded || 0} concluídas`,
      color: "text-green-600",
    },
    {
      title: "Protocolos Abertos",
      value: stats?.protocolsOpen || 0,
      icon: Clock,
      description: `${stats?.protocolsClosed || 0} protocolos concluídos`,
      color: "text-orange-600",
    },
    {
      title: "Total de Protocolos",
      value: stats?.totalProtocols || 0,
      icon: FileText,
      description: "Todas as ouvidorias registradas",
      color: "text-purple-600",
    },
    {
      title: "Notificações Enviadas",
      value: stats?.totalNotifications || 0,
      icon: Bell,
      description: "Total de notificações disparadas",
      color: "text-yellow-600",
    },
    {
      title: "Eventos Cadastrados",
      value: stats?.totalEvents || 0,
      icon: CheckCircle,
      description: "Eventos na agenda municipal",
      color: "text-teal-600",
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              Painel do Prefeito
            </h1>
            <p className="text-muted-foreground mt-2">
              Visão geral de todas as secretarias e serviços municipais
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{card.value}</div>
                    <CardDescription className="mt-1">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Relatórios Detalhados</CardTitle>
              <CardDescription>
                Análises e métricas por secretaria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Em desenvolvimento - Relatórios detalhados por secretaria serão adicionados em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

const PainelPrefeito = () => {
  return (
    <ProtectedRoute allowedRoles={["prefeito"]}>
      <PainelPrefeitoContent />
    </ProtectedRoute>
  );
};

export default PainelPrefeito;
