import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { ProtocolsTable } from "@/components/admin/ProtocolsTable";
import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { getIconComponent } from "@/lib/iconMapper";

const PainelSecretarioContent = () => {
  const { data: assignment } = useQuery({
    queryKey: ["secretary-assignment"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const { data: secretaria } = await supabase
          .from("secretarias")
          .select("*")
          .eq("slug", data.secretaria_slug)
          .single();
        
        return { ...data, secretarias: secretaria };
      }
      
      return data;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["secretary-appointments", assignment?.secretaria_slug],
    queryFn: async () => {
      if (!assignment?.secretaria_slug) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("secretaria_slug", assignment.secretaria_slug)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!assignment,
  });

  const { data: protocols } = useQuery({
    queryKey: ["secretary-protocols", assignment?.secretaria_slug],
    queryFn: async () => {
      if (!assignment?.secretaria_slug) return [];

      const { data, error } = await supabase
        .from("ombudsman_protocols")
        .select("*")
        .eq("category", assignment.secretaria_slug)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!assignment,
  });

  const pendingAppointments = appointments?.filter((a) => a.status === "pendente").length || 0;
  const confirmedAppointments = appointments?.filter((a) => a.status === "confirmado").length || 0;
  const openProtocols = protocols?.filter((p) => p.status === "aberto").length || 0;
  const inProgressProtocols = protocols?.filter((p) => p.status === "em_andamento").length || 0;
  const closedProtocols = protocols?.filter((p) => p.status === "encerrado").length || 0;

  // Type guard para verificar se temos os dados completos da secretaria
  if (!assignment || !('secretarias' in assignment) || !assignment.secretarias) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sem Atribuição</h2>
          <p className="text-muted-foreground">
            Você ainda não foi atribuído a nenhuma secretaria. Entre em contato com o administrador.
          </p>
        </div>
      </Layout>
    );
  }

  const secretaria = assignment.secretarias;
  const IconComponent = getIconComponent(secretaria.icon);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ backgroundColor: secretaria.color }}
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
              <IconComponent className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Painel do Secretário</h1>
              <p className="text-lg opacity-90">{secretaria.name}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Protocolos Abertos"
            value={openProtocols}
            icon={FileText}
            description="Aguardando resposta"
            color="#f59e0b"
          />
          <StatCard
            title="Em Andamento"
            value={inProgressProtocols}
            icon={Clock}
            description="Sendo processados"
            color="#3b82f6"
          />
          <StatCard
            title="Protocolos Encerrados"
            value={closedProtocols}
            icon={CheckCircle}
            description="Resolvidos"
            color="#22c55e"
          />
          <StatCard
            title="Total de Protocolos"
            value={protocols?.length || 0}
            icon={FileText}
            description="Histórico completo"
          />
        </div>

        {/* Appointments Section (Only for Saúde) */}
        {assignment.secretaria_slug === "saude" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Consultas Pendentes"
                value={pendingAppointments}
                icon={Calendar}
                description="A confirmar"
                color="#8b5cf6"
              />
              <StatCard
                title="Consultas Confirmadas"
                value={confirmedAppointments}
                icon={CheckCircle}
                description="Agendadas"
                color="#22c55e"
              />
              <StatCard
                title="Total de Consultas"
                value={appointments?.length || 0}
                icon={Calendar}
                description="Histórico"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Consultas</CardTitle>
                <CardDescription>
                  Confirme, cancele ou adicione observações às consultas agendadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments && appointments.length > 0 ? (
                  <AppointmentsTable 
                    appointments={appointments} 
                    queryKey={["secretary-appointments", assignment.secretaria_slug]} 
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma consulta registrada ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Protocols Management */}
        <Card>
          <CardHeader>
            <CardTitle>Protocolos da Ouvidoria</CardTitle>
            <CardDescription>
              Gerencie os protocolos direcionados à {secretaria.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {protocols && protocols.length > 0 ? (
              <ProtocolsTable 
                protocols={protocols} 
                queryKey={["secretary-protocols", assignment.secretaria_slug]} 
              />
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

const PainelSecretario = () => {
  return (
    <ProtectedRoute allowedRoles={["secretario"]}>
      <PainelSecretarioContent />
    </ProtectedRoute>
  );
};

export default PainelSecretario;
