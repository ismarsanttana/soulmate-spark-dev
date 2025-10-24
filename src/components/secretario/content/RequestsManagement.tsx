import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SecretariaInfo {
  slug: string;
  name: string;
}

const priorityLabels = {
  baixa: { label: "Baixa", variant: "outline" as const },
  normal: { label: "Normal", variant: "secondary" as const },
  alta: { label: "Alta", variant: "default" as const },
  urgente: { label: "Urgente", variant: "destructive" as const },
};

const statusLabels = {
  pendente: { label: "Pendente", icon: Clock, color: "text-yellow-600" },
  em_andamento: { label: "Em Andamento", icon: AlertCircle, color: "text-blue-600" },
  concluida: { label: "Concluída", icon: CheckCircle, color: "text-green-600" },
  cancelada: { label: "Cancelada", icon: XCircle, color: "text-red-600" },
};

export function RequestsManagement({ secretariaSlug }: { secretariaSlug: string }) {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const queryClient = useQueryClient();

  const [newRequest, setNewRequest] = useState({
    to_secretary_slug: "",
    title: "",
    description: "",
    priority: "normal",
  });

  const [response, setResponse] = useState({
    status: "em_andamento",
    response: "",
  });

  // Buscar todas as secretarias
  const { data: secretarias = [] } = useQuery({
    queryKey: ["secretarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretarias")
        .select("slug, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as SecretariaInfo[];
    },
  });

  // Buscar solicitações recebidas
  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["received-requests", secretariaSlug],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("to_secretary_slug", secretariaSlug)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes das secretarias
      const fromSlugs = [...new Set(requests?.map((r) => r.from_secretary_slug) || [])];
      const { data: fromSecretarias } = await supabase
        .from("secretarias")
        .select("slug, name")
        .in("slug", fromSlugs);

      // Adicionar nomes às solicitações
      return requests?.map((request) => ({
        ...request,
        from_secretaria: fromSecretarias?.find((s) => s.slug === request.from_secretary_slug),
      })) || [];
    },
  });

  // Buscar solicitações enviadas
  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sent-requests", secretariaSlug],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("from_secretary_slug", secretariaSlug)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes das secretarias
      const toSlugs = [...new Set(requests?.map((r) => r.to_secretary_slug) || [])];
      const { data: toSecretarias } = await supabase
        .from("secretarias")
        .select("slug, name")
        .in("slug", toSlugs);

      // Adicionar nomes às solicitações
      return requests?.map((request) => ({
        ...request,
        to_secretaria: toSecretarias?.find((s) => s.slug === request.to_secretary_slug),
      })) || [];
    },
  });

  // Criar nova solicitação
  const createRequest = useMutation({
    mutationFn: async (data: typeof newRequest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("secretary_requests")
        .insert({
          from_secretary_slug: secretariaSlug,
          from_user_id: user.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent-requests"] });
      setIsNewRequestOpen(false);
      setNewRequest({
        to_secretary_slug: "",
        title: "",
        description: "",
        priority: "normal",
      });
      toast.success("Solicitação enviada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar solicitação");
    },
  });

  // Responder solicitação
  const respondRequest = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("secretary_requests")
        .update({
          ...data,
          responded_by: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests-count"] });
      setSelectedRequest(null);
      toast.success("Resposta enviada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar resposta");
    },
  });

  const handleCreateRequest = () => {
    if (!newRequest.to_secretary_slug || !newRequest.title || !newRequest.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createRequest.mutate(newRequest);
  };

  const handleRespond = () => {
    if (!response.response) {
      toast.error("Escreva uma resposta");
      return;
    }
    respondRequest.mutate({ id: selectedRequest.id, ...response });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Solicitações</h2>
          <p className="text-muted-foreground">
            Gerencie comunicações internas com outras secretarias
          </p>
        </div>

        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Solicitação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to_secretary">Secretaria Destinatária *</Label>
                <Select
                  value={newRequest.to_secretary_slug}
                  onValueChange={(value) =>
                    setNewRequest({ ...newRequest, to_secretary_slug: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a secretaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {secretarias
                      .filter((s) => s.slug !== secretariaSlug)
                      .map((secretaria) => (
                        <SelectItem key={secretaria.slug} value={secretaria.slug}>
                          {secretaria.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={newRequest.priority}
                  onValueChange={(value) =>
                    setNewRequest({ ...newRequest, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, title: e.target.value })
                  }
                  placeholder="Ex: Solicitação de apoio para evento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, description: e.target.value })
                  }
                  placeholder="Descreva detalhadamente sua solicitação..."
                  rows={5}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRequest} disabled={createRequest.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="recebidas" className="w-full">
        <TabsList>
          <TabsTrigger value="recebidas">
            Recebidas
            {receivedRequests.filter((r) => r.status === "pendente").length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {receivedRequests.filter((r) => r.status === "pendente").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
        </TabsList>

        <TabsContent value="recebidas" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma solicitação recebida
              </CardContent>
            </Card>
          ) : (
            receivedRequests.map((request) => {
              const StatusIcon = statusLabels[request.status as keyof typeof statusLabels].icon;
              const priority = priorityLabels[request.priority as keyof typeof priorityLabels];

              return (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {request.title}
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                        </CardTitle>
                        <CardDescription>
                          De: {request.from_secretaria?.name} •{" "}
                          {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-5 w-5 ${statusLabels[request.status as keyof typeof statusLabels].color}`} />
                        <span className={statusLabels[request.status as keyof typeof statusLabels].color}>
                          {statusLabels[request.status as keyof typeof statusLabels].label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Descrição</Label>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{request.description}</p>
                    </div>

                    {request.response && (
                      <div className="border-t pt-4">
                        <Label>Resposta</Label>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{request.response}</p>
                        {request.responded_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Respondido em{" "}
                            {format(new Date(request.responded_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {request.status === "pendente" && (
                      <Dialog
                        open={selectedRequest?.id === request.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setSelectedRequest(null);
                            setResponse({ status: "em_andamento", response: "" });
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedRequest(request)}>
                            Responder
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Responder Solicitação</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={response.status}
                                onValueChange={(value) =>
                                  setResponse({ ...response, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                  <SelectItem value="concluida">Concluída</SelectItem>
                                  <SelectItem value="cancelada">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Resposta *</Label>
                              <Textarea
                                value={response.response}
                                onChange={(e) =>
                                  setResponse({ ...response, response: e.target.value })
                                }
                                placeholder="Escreva sua resposta..."
                                rows={5}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setResponse({ status: "em_andamento", response: "" });
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleRespond}
                                disabled={respondRequest.isPending}
                              >
                                Enviar Resposta
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="enviadas" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma solicitação enviada
              </CardContent>
            </Card>
          ) : (
            sentRequests.map((request) => {
              const StatusIcon = statusLabels[request.status as keyof typeof statusLabels].icon;
              const priority = priorityLabels[request.priority as keyof typeof priorityLabels];

              return (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {request.title}
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                        </CardTitle>
                        <CardDescription>
                          Para: {request.to_secretaria?.name} •{" "}
                          {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-5 w-5 ${statusLabels[request.status as keyof typeof statusLabels].color}`} />
                        <span className={statusLabels[request.status as keyof typeof statusLabels].color}>
                          {statusLabels[request.status as keyof typeof statusLabels].label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Descrição</Label>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{request.description}</p>
                    </div>

                    {request.response && (
                      <div className="border-t pt-4">
                        <Label>Resposta</Label>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{request.response}</p>
                        {request.responded_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Respondido em{" "}
                            {format(new Date(request.responded_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
