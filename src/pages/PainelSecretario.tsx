import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { SecretarioLayout } from "@/components/secretario/SecretarioLayout";
import { NewsManagementSec } from "@/components/secretario/content/NewsManagementSec";
import { StoriesManagement } from "@/components/secretario/content/StoriesManagement";
import { PushNotifications } from "@/components/secretario/content/PushNotifications";

const PainelSecretarioContent = () => {
  const [activeTab, setActiveTab] = useState("noticias");
  
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

  // Type guard para verificar se temos os dados completos da secretaria
  if (!assignment || !('secretarias' in assignment) || !assignment.secretarias) {
    return (
      <SecretarioLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sem Atribuição</h2>
          <p className="text-muted-foreground">
            Você ainda não foi atribuído a nenhuma secretaria. Entre em contato com o administrador.
          </p>
        </div>
      </SecretarioLayout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "noticias":
        return <NewsManagementSec />;
      case "stories":
        return <StoriesManagement />;
      case "push":
        return <PushNotifications />;
      case "agenda":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Agenda da Cidade</CardTitle>
              <CardDescription>Gerencie a agenda de eventos e compromissos da cidade</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "galeria":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Galeria de Imagens</CardTitle>
              <CardDescription>Gerencie as fotos e álbuns da cidade</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "eventos":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
              <CardDescription>Gerencie os eventos da cidade</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "transmissao":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transmissão ao Vivo</CardTitle>
              <CardDescription>Configure e gerencie transmissões ao vivo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "podcast":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Podcasts</CardTitle>
              <CardDescription>Gerencie os podcasts da cidade</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      case "banners":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Banners de Campanha</CardTitle>
              <CardDescription>Gerencie os banners e campanhas publicitárias</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <SecretarioLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </SecretarioLayout>
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
