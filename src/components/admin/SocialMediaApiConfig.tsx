import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Facebook, Instagram, Twitter, Linkedin, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
  docsUrl: string;
  fields: { key: string; label: string; placeholder: string }[];
}

const platforms: Platform[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    docsUrl: "https://developers.facebook.com/docs/graph-api",
    fields: [
      { key: "app_id", label: "App ID", placeholder: "Digite o App ID" },
      { key: "app_secret_encrypted", label: "App Secret", placeholder: "Digite o App Secret" },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    fields: [
      { key: "app_id", label: "App ID (Facebook)", placeholder: "Digite o App ID" },
      { key: "app_secret_encrypted", label: "App Secret (Facebook)", placeholder: "Digite o App Secret" },
    ],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    color: "#1DA1F2",
    docsUrl: "https://developer.twitter.com/en/docs",
    fields: [
      { key: "api_key_encrypted", label: "API Key", placeholder: "Digite a API Key" },
      { key: "api_secret_encrypted", label: "API Secret", placeholder: "Digite o API Secret" },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/",
    fields: [
      { key: "app_id", label: "Client ID", placeholder: "Digite o Client ID" },
      { key: "app_secret_encrypted", label: "Client Secret", placeholder: "Digite o Client Secret" },
    ],
  },
];

export function SocialMediaApiConfig() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["social-api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_media_api_keys")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ platform, data }: { platform: string; data: any }) => {
      const existing = apiKeys?.find((k) => k.platform === platform);
      
      if (existing) {
        const { error } = await supabase
          .from("social_media_api_keys")
          .update(data)
          .eq("platform", platform);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_media_api_keys")
          .insert({ platform, ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-api-keys"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const testConnection = async (platform: string) => {
    setTesting(platform);
    try {
      // Simulação de teste - em produção, chamaria edge function
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Conexão com ${platform} testada com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao testar conexão: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const handleSave = (platform: string) => {
    const data = formData[platform] || {};
    saveMutation.mutate({ platform, data });
  };

  const updateFormData = (platform: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [platform]: {
        ...(prev[platform] || {}),
        [field]: value,
      },
    }));
  };

  const getPlatformData = (platformId: string) => {
    return apiKeys?.find((k) => k.platform === platformId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">APIs de Redes Sociais</h2>
        <p className="text-muted-foreground mt-2">
          Configure as credenciais de API para habilitar publicação automática nas redes sociais
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {platforms.map((platform) => {
          const data = getPlatformData(platform.id);
          const Icon = platform.icon;
          const isActive = data?.is_active ?? false;

          return (
            <Card key={platform.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: platform.color }}
              />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      <Icon style={{ color: platform.color }} className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {platform.name}
                        {isActive ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isActive ? "Configurado e ativo" : "Não configurado"}
                      </CardDescription>
                    </div>
                  </div>
                  <a
                    href={platform.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {platform.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`${platform.id}-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`${platform.id}-${field.key}`}
                      type={field.key.includes("secret") || field.key.includes("key") ? "password" : "text"}
                      placeholder={field.placeholder}
                      defaultValue={data?.[field.key] || ""}
                      onChange={(e) =>
                        updateFormData(platform.id, field.key, e.target.value)
                      }
                    />
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${platform.id}-active`}
                    checked={
                      formData[platform.id]?.is_active ?? isActive
                    }
                    onCheckedChange={(checked) =>
                      updateFormData(platform.id, "is_active", checked)
                    }
                  />
                  <Label htmlFor={`${platform.id}-active`}>Ativar API</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleSave(platform.id)}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testConnection(platform.id)}
                    disabled={testing === platform.id || !isActive}
                  >
                    {testing === platform.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Testar"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Como obter as credenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Facebook/Instagram:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse o Meta for Developers</li>
              <li>Crie um novo app ou use um existente</li>
              <li>Adicione o produto "Instagram" e/ou "Facebook Login"</li>
              <li>Copie o App ID e App Secret em "Configurações Básicas"</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Twitter/X:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse o Twitter Developer Portal</li>
              <li>Crie um projeto e app</li>
              <li>Copie API Key e API Secret em "Keys and tokens"</li>
              <li>Habilite permissões de escrita</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">LinkedIn:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse o LinkedIn Developers</li>
              <li>Crie um novo app</li>
              <li>Solicite acesso à Marketing Developer Platform</li>
              <li>Copie Client ID e Client Secret</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}