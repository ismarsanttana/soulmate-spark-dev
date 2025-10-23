import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, Bell, Calendar, Building2, Newspaper } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { ProtocolsTable } from "@/components/admin/ProtocolsTable";
import { getIconComponent } from "@/lib/iconMapper";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
        newsResult,
        secretariasResult,
      ] = await Promise.all([
        supabase.from("appointments").select("id, status", { count: "exact" }),
        supabase.from("ombudsman_protocols").select("id, status, category", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("notifications").select("id", { count: "exact" }),
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("news").select("id", { count: "exact" }),
        supabase.from("secretarias").select("id, is_active", { count: "exact" }),
      ]);

      const appointmentsPending = appointmentsResult.data?.filter(
        (a) => a.status === "pendente"
      ).length || 0;
      
      const protocolsOpen = protocolsResult.data?.filter(
        (p) => p.status === "aberto"
      ).length || 0;
      
      const protocolsClosed = protocolsResult.data?.filter(
        (p) => p.status === "encerrado"
      ).length || 0;

      // Group protocols by category
      const protocolsBySecretaria = protocolsResult.data?.reduce((acc: any, p) => {
        const category = p.category || "outros";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      return {
        totalUsers: usersResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        appointmentsPending,
        totalProtocols: protocolsResult.count || 0,
        protocolsOpen,
        protocolsClosed,
        totalNotifications: notificationsResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalNews: newsResult.count || 0,
        totalSecretarias: secretariasResult.data?.filter((s) => s.is_active).length || 0,
        protocolsBySecretaria,
      };
    },
  });

  const { data: protocols } = useQuery({
    queryKey: ["all-protocols-prefeito"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ombudsman_protocols")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: secretarias } = useQuery({
    queryKey: ["secretarias-prefeito"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretarias")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments-prefeito"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("*");

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = data?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      return data?.map(assignment => ({
        ...assignment,
        profile: profiles?.find(p => p.id === assignment.user_id)
      }));
    },
  });

  // Prepare chart data
  const protocolsChartData = Object.entries(stats?.protocolsBySecretaria || {}).map(([category, count]) => ({
    name: category,
    protocolos: count,
  }));

  const statusChartData = [
    { name: "Abertos", value: stats?.protocolsOpen || 0, color: "#3b82f6" },
    { name: "Encerrados", value: stats?.protocolsClosed || 0, color: "#22c55e" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Painel do Prefeito</h1>
          <p className="text-muted-foreground">
            Visão geral de todas as secretarias e serviços municipais
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Usuários Cadastrados"
            value={stats?.totalUsers || 0}
            icon={Users}
            description="Total de cidadãos no sistema"
          />
          <StatCard
            title="Secretarias Ativas"
            value={stats?.totalSecretarias || 0}
            icon={Building2}
            description="Departamentos ativos"
          />
          <StatCard
            title="Protocolos Abertos"
            value={stats?.protocolsOpen || 0}
            icon={FileText}
            description="Aguardando resposta"
            color="#f59e0b"
          />
          <StatCard
            title="Consultas Pendentes"
            value={stats?.appointmentsPending || 0}
            icon={Calendar}
            description="Agendamentos a confirmar"
            color="#8b5cf6"
          />
          <StatCard
            title="Notícias Publicadas"
            value={stats?.totalNews || 0}
            icon={Newspaper}
            description="Conteúdo no portal"
            color="#06b6d4"
          />
          <StatCard
            title="Eventos Cadastrados"
            value={stats?.totalEvents || 0}
            icon={Clock}
            description="Agenda da cidade"
            color="#ec4899"
          />
          <StatCard
            title="Total de Protocolos"
            value={stats?.totalProtocols || 0}
            icon={FileText}
            description="Histórico completo"
          />
          <StatCard
            title="Taxa de Resolução"
            value={`${Math.round(((stats?.protocolsClosed || 0) / (stats?.totalProtocols || 1)) * 100)}%`}
            icon={CheckCircle}
            description="Protocolos resolvidos"
            color="#22c55e"
          />
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Protocolos por Secretaria</CardTitle>
              <CardDescription>Distribuição de demandas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={protocolsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="protocolos" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Protocolos</CardTitle>
              <CardDescription>Abertos vs Encerrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Secretarias Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Secretarias Municipais</CardTitle>
            <CardDescription>Visão geral dos departamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {secretarias?.map((secretaria) => {
                const IconComponent = getIconComponent(secretaria.icon);
                const assignment = assignments?.find((a: any) => a.secretaria_slug === secretaria.slug);
                const secretaryName = assignment?.profile?.full_name || "Não atribuído";

                return (
                  <div
                    key={secretaria.id}
                    className="border rounded-lg p-4"
                    style={{ borderLeft: `4px solid ${secretaria.color}` }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${secretaria.color}20` }}
                      >
                        <IconComponent className="h-5 w-5" style={{ color: secretaria.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{secretaria.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Secretário: {secretaryName}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Protocols */}
        <Card>
          <CardHeader>
            <CardTitle>Protocolos Recentes</CardTitle>
            <CardDescription>Últimos 10 protocolos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {protocols && protocols.length > 0 ? (
              <ProtocolsTable protocols={protocols} queryKey={["all-protocols-prefeito"]} />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum protocolo registrado ainda
              </p>
            )}
          </CardContent>
        </Card>
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
