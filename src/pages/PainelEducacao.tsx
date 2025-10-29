import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AlertCircle } from "lucide-react";
import { EducacaoLayout } from "@/components/educacao/EducacaoLayout";
import { Dashboard } from "@/components/educacao/content/Dashboard";
import { TeamManagement } from "@/components/secretario/content/TeamManagement";
import { EnrollmentsManagement } from "@/components/educacao/content/EnrollmentsManagement";
import { StudentsManagement } from "@/components/educacao/content/StudentsManagement";
import { StudentsManagementComplete } from "@/components/educacao/content/StudentsManagementComplete";
import { RequestsManagement } from "@/components/secretario/content/RequestsManagement";
import { ClassesManagement } from "@/components/educacao/content/ClassesManagement";
import { TimeclockManagement } from "@/components/educacao/content/TimeclockManagement";
import ReportsManagement from "@/components/secretario/content/ReportsManagement";
import { ComprasManagement } from "@/components/educacao/content/ComprasManagement";
import { FrotaManagement } from "@/components/educacao/content/FrotaManagement";
import { SecretarioProfile } from "@/components/secretario/SecretarioProfile";
import { ProfessorsManagement } from "@/components/educacao/content/ProfessorsManagement";
import HubDadosEducacionais from "@/components/educacao/content/HubDadosEducacionais";

const PainelEducacaoContent = () => {
  const [activeTab, setActiveTab] = useState("painel");
  
  const { data: assignment } = useQuery({
    queryKey: ["secretary-assignment-educacao"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("*")
        .eq("user_id", user.id)
        .eq("secretaria_slug", "educacao")
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

  if (!assignment || !('secretarias' in assignment) || !assignment.secretarias) {
    return (
      <EducacaoLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sem Atribuição</h2>
          <p className="text-muted-foreground">
            Você ainda não foi atribuído à Secretaria de Educação. Entre em contato com o administrador.
          </p>
        </div>
      </EducacaoLayout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "painel":
        return (
          <div className="space-y-4">
            <div className="ascom-page-header">
              <div>
                <h1 className="ascom-page-title">Painel da Secretaria de Educação</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Visão geral das atividades da secretaria
                </p>
              </div>
            </div>
            <Dashboard secretariaSlug={assignment.secretaria_slug} />
          </div>
        );
      case "equipe":
        return <TeamManagement secretariaSlug={assignment.secretaria_slug} />;
      case "professores":
        return <ProfessorsManagement secretariaSlug={assignment.secretaria_slug} />;
      case "turmas":
        return <ClassesManagement secretariaSlug={assignment.secretaria_slug} />;
      case "matriculas":
        return <EnrollmentsManagement secretariaSlug={assignment.secretaria_slug} />;
      case "alunos":
        return <StudentsManagementComplete secretariaSlug={assignment.secretaria_slug} />;
      case "inep":
        return <HubDadosEducacionais secretariaSlug={assignment.secretaria_slug} />;
      case "ponto":
        return <TimeclockManagement secretariaSlug={assignment.secretaria_slug} />;
      case "compras":
        return <ComprasManagement />;
      case "frota":
        return <FrotaManagement />;
      case "relatorios":
        return <ReportsManagement />;
      case "solicitacoes":
        return <RequestsManagement secretariaSlug={assignment.secretaria_slug} />;
      case "perfil":
        return <SecretarioProfile />;
      default:
        return null;
    }
  };

  return (
    <EducacaoLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </EducacaoLayout>
  );
};

const PainelEducacao = () => {
  return (
    <ProtectedRoute allowedRoles={["secretario"]}>
      <PainelEducacaoContent />
    </ProtectedRoute>
  );
};

export default PainelEducacao;
