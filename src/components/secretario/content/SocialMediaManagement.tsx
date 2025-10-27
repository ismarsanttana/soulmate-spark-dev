import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const platformConfig = {
  facebook: { name: "Facebook", icon: Facebook, color: "#1877F2" },
  instagram: { name: "Instagram", icon: Instagram, color: "#E4405F" },
  twitter: { name: "Twitter / X", icon: Twitter, color: "#1DA1F2" },
  linkedin: { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
};

const statusConfig = {
  pending: { label: "Pendente", variant: "secondary" as const },
  published: { label: "Publicado", variant: "default" as const },
  failed: { label: "Falhou", variant: "destructive" as const },
  scheduled: { label: "Agendado", variant: "outline" as const },
  cancelled: { label: "Cancelado", variant: "secondary" as const },
};

export function SocialMediaManagement() {
  const [secretariaSlug, setSecretariaSlug] = useState<string>("");

  // Buscar secretaria do usuário
  useQuery({
    queryKey: ["user-secretaria"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .single();

      if (data) setSecretariaSlug(data.secretaria_slug);
      return data;
    },
  });

  // Buscar contas conectadas
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["social-accounts", secretariaSlug],
    queryFn: async () => {
      if (!secretariaSlug) return [];
      const { data, error } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("secretaria_slug", secretariaSlug);
      if (error) throw error;
      return data;
    },
    enabled: !!secretariaSlug,
  });

  // Buscar histórico de publicações
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["social-posts", secretariaSlug],
    queryFn: async () => {
      if (!secretariaSlug || !accounts) return [];
      const accountIds = accounts.map((a) => a.id);
      const { data, error } = await supabase
        .from("social_media_posts")
        .select("*")
        .in("account_id", accountIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!secretariaSlug && !!accounts,
  });

  const handleConnect = async (platform: string) => {
    toast.info("Iniciando conexão OAuth...");
    // TODO: Implementar OAuth via edge function
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("social_media_accounts")
        .delete()
        .eq("id", accountId);
      
      if (error) throw error;
      toast.success("Conta desconectada com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao desconectar: ${error.message}`);
    }
  };

  const toggleAutoPublish = async (accountId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("social_media_accounts")
        .update({ auto_publish: !currentValue })
        .eq("id", accountId);
      
      if (error) throw error;
      toast.success("Configuração atualizada!");
    } catch (error: any) {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Redes Sociais</h2>
        <p className="text-muted-foreground mt-2">
          Conecte e gerencie as redes sociais da sua secretaria
        </p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Contas Conectadas</TabsTrigger>
          <TabsTrigger value="history">Histórico de Publicações</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(platformConfig).map(([key, config]) => {
              const account = accounts?.find((a) => a.platform === key);
              const Icon = config.icon;
              const isConnected = !!account;

              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon style={{ color: config.color }} className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <CardDescription>
                            {isConnected ? account.account_name : "Não conectado"}
                          </CardDescription>
                        </div>
                      </div>
                      {isConnected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isConnected ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${key}-auto`}
                              checked={account.auto_publish}
                              onCheckedChange={() =>
                                toggleAutoPublish(account.id, account.auto_publish)
                              }
                            />
                            <Label htmlFor={`${key}-auto`}>Publicação Automática</Label>
                          </div>
                        </div>
                        {account.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Última sincronização:{" "}
                            {format(new Date(account.last_sync_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDisconnect(account.id)}
                          >
                            Desconectar
                          </Button>
                          <Button variant="outline" size="sm">
                            Testar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleConnect(key)}
                        className="w-full"
                        style={{ backgroundColor: config.color }}
                      >
                        Conectar {config.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Publicações</CardTitle>
              <CardDescription>
                Todas as publicações realizadas nas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !posts || posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma publicação encontrada
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Engajamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => {
                      const platform = platformConfig[post.platform as keyof typeof platformConfig];
                      const status = statusConfig[post.status as keyof typeof statusConfig];
                      const Icon = platform.icon;

                      return (
                        <TableRow key={post.id}>
                          <TableCell>
                            {format(new Date(post.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="capitalize">{post.content_type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon
                                style={{ color: platform.color }}
                                className="h-4 w-4"
                              />
                              {platform.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {post.engagement_stats &&
                            Object.keys(post.engagement_stats).length > 0 ? (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">
                                  {(post.engagement_stats as any).likes || 0} curtidas
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {post.post_url && (
                              <a
                                href={post.post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Publicações Agendadas</CardTitle>
              </div>
              <CardDescription>
                Posts programados para publicação futura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Nenhuma publicação agendada
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}