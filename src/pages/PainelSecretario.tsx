import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PainelSecretarioContent = () => {
  const { data: assignment } = useQuery({
    queryKey: ["secretary-assignment"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["secretary-appointments", assignment?.secretaria_slug],
    queryFn: async () => {
      if (!assignment?.secretaria_slug || assignment.secretaria_slug !== "saude") {
        return [];
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });

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
  const openProtocols = protocols?.filter((p) => p.status === "aberto").length || 0;

  const getSecretariaName = (slug: string) => {
    const names: Record<string, string> = {
      saude: "Saúde",
      educacao: "Educação",
      assistencia: "Assistência Social",
      financas: "Finanças",
      cultura: "Cultura",
      obras: "Obras",
      esporte: "Esporte",
    };
    return names[slug] || slug;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              Painel do Secretário
            </h1>
            {assignment && (
              <p className="text-muted-foreground mt-2">
                Secretaria de {getSecretariaName(assignment.secretaria_slug)}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Consultas Pendentes
                </CardTitle>
                <Clock className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingAppointments}</div>
                <CardDescription className="mt-1">
                  Aguardando confirmação
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Protocolos Abertos
                </CardTitle>
                <FileText className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{openProtocols}</div>
                <CardDescription className="mt-1">
                  Requerem atenção
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Consultas
                </CardTitle>
                <Calendar className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{appointments?.length || 0}</div>
                <CardDescription className="mt-1">
                  Todas as solicitações
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Protocolos
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{protocols?.length || 0}</div>
                <CardDescription className="mt-1">
                  Ouvidoria geral
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {assignment?.secretaria_slug === "saude" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Consultas Recentes</CardTitle>
                <CardDescription>
                  Últimas solicitações de agendamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments?.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.specialty} - {format(new Date(appointment.preferred_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          appointment.status === "pendente"
                            ? "secondary"
                            : appointment.status === "confirmado"
                            ? "default"
                            : "outline"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                  {!appointments?.length && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma consulta registrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Protocolos de Ouvidoria</CardTitle>
              <CardDescription>
                Solicitações e reclamações da sua secretaria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protocols?.slice(0, 5).map((protocol) => (
                  <div
                    key={protocol.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">#{protocol.protocol_number}</p>
                        <Badge variant="outline">{protocol.manifestation_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {protocol.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(protocol.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        protocol.status === "aberto"
                          ? "destructive"
                          : protocol.status === "em_andamento"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {protocol.status}
                    </Badge>
                  </div>
                ))}
                {!protocols?.length && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum protocolo registrado para sua secretaria
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
