import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PrefeitoLayout } from "@/components/prefeito/PrefeitoLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Calendar, Building2, Newspaper, Timer, UserCheck } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { ProtocolsTable } from "@/components/admin/ProtocolsTable";
import { getIconComponent } from "@/lib/iconMapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const PainelPrefeitoContent = () => {
  const [selectedSecretaria, setSelectedSecretaria] = useState<string>("todas");

  const { data: stats } = useQuery({
    queryKey: ["prefeito-stats"],
    queryFn: async () => {
      const [appointmentsResult, protocolsResult, usersResult, eventsResult, newsResult, secretariasResult] = await Promise.all([
        supabase.from("appointments").select("id, status", { count: "exact" }),
        supabase.from("ombudsman_protocols").select("id, status, category", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("news").select("id", { count: "exact" }),
        supabase.from("secretarias").select("id, is_active", { count: "exact" }),
      ]);

      const appointmentsPending = appointmentsResult.data?.filter(a => a.status === "pendente").length || 0;
      const protocolsOpen = protocolsResult.data?.filter(p => p.status === "aberto").length || 0;
      const protocolsClosed = protocolsResult.data?.filter(p => p.status === "encerrado").length || 0;
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
        totalEvents: eventsResult.count || 0,
        totalNews: newsResult.count || 0,
        totalSecretarias: secretariasResult.data?.filter(s => s.is_active).length || 0,
        protocolsBySecretaria,
      };
    },
  });

  const { data: protocols } = useQuery({
    queryKey: ["all-protocols-prefeito"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ombudsman_protocols").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: secretarias } = useQuery({
    queryKey: ["secretarias-prefeito"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secretarias").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments-prefeito"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secretary_assignments").select("*");
      if (error) throw error;
      const userIds = data?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      return data?.map(assignment => ({ ...assignment, profile: profiles?.find(p => p.id === assignment.user_id) }));
    },
  });

  const { data: queueData } = useQuery({
    queryKey: ["queue-data", selectedSecretaria],
    queryFn: async () => {
      let query = supabase.from("attendance_queue").select("*");
      if (selectedSecretaria !== "todas") query = query.eq("secretaria_slug", selectedSecretaria);
      const { data, error } = await query;
      if (error) throw error;

      const waiting = data?.filter(q => q.status === "waiting").length || 0;
      const inService = data?.filter(q => q.status === "in_service").length || 0;
      const completed = data?.filter(q => q.status === "completed").length || 0;

      const completedToday = data?.filter(q => {
        if (q.status === "completed" && q.completed_at && q.created_at) {
          return new Date(q.completed_at).toDateString() === new Date().toDateString();
        }
        return false;
      }) || [];

      const avgWaitTime = completedToday.length > 0
        ? Math.round(completedToday.reduce((acc, q) => acc + (new Date(q.completed_at!).getTime() - new Date(q.created_at).getTime()), 0) / completedToday.length / (1000 * 60))
        : 0;

      const byLocation = data?.reduce((acc: any, q) => {
        const loc = q.location || "Não especificado";
        if (!acc[loc]) acc[loc] = { waiting: 0, inService: 0, completed: 0 };
        if (q.status === "waiting") acc[loc].waiting++;
        if (q.status === "in_service") acc[loc].inService++;
        if (q.status === "completed") acc[loc].completed++;
        return acc;
      }, {});

      return { waiting, inService, completed, avgWaitTime, byLocation };
    },
  });

  const { data: resolutionTimeData } = useQuery({
    queryKey: ["resolution-time", selectedSecretaria],
    queryFn: async () => {
      let query = supabase.from("ombudsman_protocols").select("category, created_at, updated_at, status");
      if (selectedSecretaria !== "todas") query = query.eq("category", selectedSecretaria);
      const { data, error } = await query.eq("status", "encerrado");
      if (error) throw error;

      const bySecretaria = data?.reduce((acc: any, protocol) => {
        const category = protocol.category || "outros";
        const hours = (new Date(protocol.updated_at).getTime() - new Date(protocol.created_at).getTime()) / (1000 * 60 * 60);
        if (!acc[category]) acc[category] = { total: 0, count: 0 };
        acc[category].total += hours;
        acc[category].count++;
        return acc;
      }, {});

      return Object.entries(bySecretaria || {}).map(([category, data]: [string, any]) => ({
        secretaria: category,
        tempoMedio: Math.round(data.total / data.count),
      }));
    },
  });

  const protocolsChartData = Object.entries(stats?.protocolsBySecretaria || {}).map(([category, count]) => ({ name: category, protocolos: count }));
  const statusChartData = [
    { name: "Abertos", value: stats?.protocolsOpen || 0, color: "#3b82f6" },
    { name: "Encerrados", value: stats?.protocolsClosed || 0, color: "#22c55e" },
  ];
  const queueChartData = queueData?.byLocation ? Object.entries(queueData.byLocation).map(([location, data]: [string, any]) => ({
    location, aguardando: data.waiting, emAtendimento: data.inService, concluído: data.completed,
  })) : [];
  const queueStatusData = [
    { name: "Aguardando", value: queueData?.waiting || 0, color: "#f59e0b" },
    { name: "Em Atendimento", value: queueData?.inService || 0, color: "#06b6d4" },
    { name: "Concluído", value: queueData?.completed || 0, color: "#22c55e" },
  ];

  return (
    <PrefeitoLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
            <p className="text-muted-foreground">Visão geral de todas as secretarias e serviços municipais</p>
          </div>
          <Select value={selectedSecretaria} onValueChange={setSelectedSecretaria}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione uma secretaria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Secretarias</SelectItem>
              {secretarias?.map(sec => <SelectItem key={sec.id} value={sec.slug}>{sec.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Usuários Cadastrados" value={stats?.totalUsers || 0} icon={Users} description="Total de cidadãos no sistema" />
          <StatCard title="Secretarias Ativas" value={stats?.totalSecretarias || 0} icon={Building2} description="Departamentos ativos" />
          <StatCard title="Protocolos Abertos" value={stats?.protocolsOpen || 0} icon={FileText} description="Aguardando resposta" color="#f59e0b" />
          <StatCard title="Consultas Pendentes" value={stats?.appointmentsPending || 0} icon={Calendar} description="Agendamentos a confirmar" color="#8b5cf6" />
          <StatCard title="Notícias Publicadas" value={stats?.totalNews || 0} icon={Newspaper} description="Conteúdo no portal" color="#06b6d4" />
          <StatCard title="Total de Protocolos" value={stats?.totalProtocols || 0} icon={FileText} description="Histórico completo" />
          <StatCard title="Taxa de Resolução" value={`${Math.round(((stats?.protocolsClosed || 0) / (stats?.totalProtocols || 1)) * 100)}%`} icon={CheckCircle} description="Protocolos resolvidos" color="#22c55e" />
          <StatCard title="Pessoas na Fila" value={queueData?.waiting || 0} icon={UserCheck} description="Aguardando atendimento" color="#f59e0b" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <StatCard title="Tempo Médio de Espera" value={`${queueData?.avgWaitTime || 0} min`} icon={Timer} description="Última 24h" color="#8b5cf6" />
          <StatCard title="Em Atendimento" value={queueData?.inService || 0} icon={UserCheck} description="Sendo atendidos agora" color="#06b6d4" />
        </div>

        <Tabs defaultValue="protocolos">
          <TabsList>
            <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
            <TabsTrigger value="filas">Filas</TabsTrigger>
            <TabsTrigger value="resolucao">Tempo de Resolução</TabsTrigger>
          </TabsList>

          <TabsContent value="protocolos">
            <div className="grid md:grid-cols-2 gap-6 mt-4">
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
                      <Pie data={statusChartData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={100} fill="#8884d8" dataKey="value">
                        {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="filas">
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fila por Localização</CardTitle>
                  <CardDescription>PSFs e Hospitais</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={queueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="aguardando" fill="#f59e0b" name="Aguardando" />
                      <Bar dataKey="emAtendimento" fill="#06b6d4" name="Em Atendimento" />
                      <Bar dataKey="concluído" fill="#22c55e" name="Concluído" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Atual da Fila</CardTitle>
                  <CardDescription>Distribuição de status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={queueStatusData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} dataKey="value">
                        {queueStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resolucao">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Tempo Médio de Resolução</CardTitle>
                <CardDescription>Protocolos por secretaria (em horas)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="secretaria" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tempoMedio" stroke="hsl(var(--primary))" strokeWidth={2} name="Tempo Médio (horas)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Secretarias Municipais</CardTitle>
            <CardDescription>Visão geral dos departamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {secretarias?.map(secretaria => {
                const IconComponent = getIconComponent(secretaria.icon);
                const assignment = assignments?.find((a: any) => a.secretaria_slug === secretaria.slug);
                const secretaryName = assignment?.profile?.full_name || "Não atribuído";
                return (
                  <div key={secretaria.id} className="border rounded-lg p-4" style={{ borderLeft: `4px solid ${secretaria.color}` }}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${secretaria.color}20` }}>
                        <IconComponent className="h-5 w-5" style={{ color: secretaria.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{secretaria.name}</h3>
                        <p className="text-sm text-muted-foreground">Secretário: {secretaryName}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protocolos Recentes</CardTitle>
            <CardDescription>Últimos 10 protocolos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {protocols && protocols.length > 0 ? (
              <ProtocolsTable protocols={protocols} queryKey={["all-protocols-prefeito"]} />
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum protocolo registrado ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PrefeitoLayout>
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
