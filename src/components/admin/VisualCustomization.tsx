import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Loader2 } from "lucide-react";
import { FileUpload } from "./FileUpload";

export function VisualCustomization() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [primaryColor, setPrimaryColor] = useState("#1EAEDB");
  const [secondaryColor, setSecondaryColor] = useState("#0FA0CE");
  const [appName, setAppName] = useState("Portal do Cidadão");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [iconUrl, setIconUrl] = useState<string | undefined>();
  const [logoBackgroundColor, setLogoBackgroundColor] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPrimaryColor(data.primary_color);
        setSecondaryColor(data.secondary_color);
        setAppName(data.app_name);
        setLogoUrl(data.logo_url || undefined);
        setIconUrl(data.icon_url || undefined);
        setLogoBackgroundColor(data.logo_background_color || null);
      }
      
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const settingsData = {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        app_name: appName,
        logo_url: logoUrl || null,
        icon_url: iconUrl || null,
        logo_background_color: logoBackgroundColor,
        updated_by: user?.id,
      };

      if (!settings?.id) {
        const { error } = await supabase
          .from("app_settings")
          .insert(settingsData);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .update(settingsData)
          .eq("id", settings.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({
        title: "Sucesso!",
        description: "Configurações atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalização Visual
          </CardTitle>
          <CardDescription>
            Configure as cores e informações gerais do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appName">Nome do Aplicativo</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Portal do Cidadão"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-12 w-20"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1EAEDB"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-12 w-20"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#0FA0CE"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo do Aplicativo</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Imagem principal exibida no cabeçalho. Proporção recomendada: 16:9
              </p>
              <FileUpload
                bucket="app-assets"
                path="logo"
                currentUrl={logoUrl}
                onUploadComplete={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl(undefined)}
                enableCrop={true}
                cropAspectRatio={16 / 9}
              />
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="logoBackgroundColor">Cor de Fundo da Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha uma cor de fundo ou deixe transparente
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    id="logoBackgroundColor"
                    type="color"
                    value={logoBackgroundColor || "#ffffff"}
                    onChange={(e) => setLogoBackgroundColor(e.target.value)}
                    className="h-12 w-20"
                  />
                  <Input
                    type="text"
                    value={logoBackgroundColor || ""}
                    onChange={(e) => setLogoBackgroundColor(e.target.value || null)}
                    placeholder="Transparente"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoBackgroundColor(null)}
                  >
                    Transparente
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="icon">Ícone do Aplicativo PWA</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Ícone usado no favicon e atalho do app. Proporção: 1:1 (quadrado). Tamanho recomendado: 512x512px
              </p>
              <FileUpload
                bucket="app-assets"
                path="icon"
                currentUrl={iconUrl}
                onUploadComplete={(url) => setIconUrl(url)}
                onRemove={() => setIconUrl(undefined)}
                enableCrop={true}
                cropAspectRatio={1}
              />
            </div>
          </div>

          <Button
            onClick={() => updateSettings.mutate()}
            disabled={updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview das Cores</CardTitle>
          <CardDescription>
            Visualize como as cores escolhidas ficam no aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="p-6 rounded-lg text-white font-semibold text-center"
              style={{ backgroundColor: primaryColor }}
            >
              Cor Primária - Botões e Destaques
            </div>
            <div 
              className="p-6 rounded-lg text-white font-semibold text-center"
              style={{ backgroundColor: secondaryColor }}
            >
              Cor Secundária - Elementos Complementares
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
