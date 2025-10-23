import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Settings } from "lucide-react";

const AdminContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [primaryColor, setPrimaryColor] = useState("#1EAEDB");
  const [secondaryColor, setSecondaryColor] = useState("#0FA0CE");
  const [appName, setAppName] = useState("Portal do Cidadão");

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
      }
      
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!settings?.id) {
        const { error } = await supabase
          .from("app_settings")
          .insert({
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            app_name: appName,
            updated_by: user?.id,
          });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .update({
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            app_name: appName,
            updated_by: user?.id,
          })
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-10 w-10 text-primary" />
              Painel de Administração
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure as personalizações gerais do aplicativo
            </p>
          </div>

          <div className="grid gap-6">
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

                <Button
                  onClick={() => updateSettings.mutate()}
                  disabled={updateSettings.isPending}
                  className="w-full"
                >
                  {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações sobre Secretarias</CardTitle>
                <CardDescription>
                  Gerencie as informações das secretarias cadastradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em desenvolvimento - Funcionalidade para gerenciar secretarias será adicionada em breve.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Admin = () => {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
};

export default Admin;
