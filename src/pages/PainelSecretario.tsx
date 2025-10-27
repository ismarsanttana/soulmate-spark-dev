import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { SecretarioLayout } from "@/components/secretario/SecretarioLayout";
import { NewsManagementSec } from "@/components/secretario/content/NewsManagementSec";
import { StoriesManagement } from "@/components/secretario/content/StoriesManagement";
import { PushNotifications } from "@/components/secretario/content/PushNotifications";
import { AgendaManagement } from "@/components/secretario/content/AgendaManagement";
import { GalleryManagement } from "@/components/secretario/content/GalleryManagement";
import { EventsManagementSec } from "@/components/secretario/content/EventsManagementSec";
import { LiveStreamManagement } from "@/components/secretario/content/LiveStreamManagement";
import { PodcastManagement } from "@/components/secretario/content/PodcastManagement";
import { BannersManagement } from "@/components/secretario/content/BannersManagement";
import { TeamManagement } from "@/components/secretario/content/TeamManagement";
import { RequestsManagement } from "@/components/secretario/content/RequestsManagement";
import { Dashboard } from "@/components/secretario/content/Dashboard";
import ReportsManagement from "@/components/secretario/content/ReportsManagement";
import { SocialMediaManagement } from "@/components/secretario/content/SocialMediaManagement";
import { SecretarioProfile } from "@/components/secretario/SecretarioProfile";

const PainelSecretarioContent = () => {
  const [activeTab, setActiveTab] = useState("painel");
  const location = useLocation();
  
  // Determina qual secretaria buscar baseado na rota
  const getSecretariaSlug = () => {
    const path = location.pathname;
    if (path === "/ascom") return "comunicacao";
    if (path === "/edu") return "educacao";
    // Para outras rotas genéricas, retorna null para buscar qualquer
    return null;
  };
  
  const { data: assignment } = useQuery({
    queryKey: ["secretary-assignment", getSecretariaSlug()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const targetSlug = getSecretariaSlug();
      
      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("*")
        .eq("user_id", user.id)
        .eq("secretaria_slug", targetSlug || "comunicacao")
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
      case "painel":
        return <Dashboard secretariaSlug={assignment.secretaria_slug} />;
      case "noticias":
        return <NewsManagementSec />;
      case "stories":
        return <StoriesManagement />;
      case "push":
        return <PushNotifications />;
      case "agenda":
        return <AgendaManagement />;
      case "galeria":
        return <GalleryManagement />;
      case "eventos":
        return <EventsManagementSec />;
      case "transmissao":
        return <LiveStreamManagement />;
      case "podcast":
        return <PodcastManagement />;
      case "banners":
        return <BannersManagement />;
      case "relatorios":
        return <ReportsManagement />;
      case "redes-sociais":
        return <SocialMediaManagement />;
      case "solicitacoes":
        return <RequestsManagement secretariaSlug={assignment.secretaria_slug} />;
      case "equipe":
        return <TeamManagement secretariaSlug={assignment.secretaria_slug} />;
      case "perfil":
        return <SecretarioProfile />;
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
