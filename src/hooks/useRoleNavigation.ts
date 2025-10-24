import { useUserRole } from "./useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRoleNavigation = () => {
  const { data: roleData } = useUserRole();

  const { data: secretaryAssignment } = useQuery({
    queryKey: ["secretary-assignment-navigation"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: roleData?.isSecretario || false,
  });

  const getRolePanels = () => {
    const panels: { label: string; path: string; icon: string }[] = [];

    if (roleData?.isAdmin) {
      panels.push({ label: "Admin", path: "/admin", icon: "shield-alt" });
    }
    if (roleData?.isPrefeito) {
      panels.push({ label: "Prefeito", path: "/painel-prefeito", icon: "landmark" });
    }
    if (roleData?.isSecretario) {
      // Redireciona para o painel específico da secretaria
      if (secretaryAssignment?.secretaria_slug === "educacao") {
        panels.push({ label: "Educação", path: "/edu", icon: "graduation-cap" });
      } else if (secretaryAssignment?.secretaria_slug === "comunicacao") {
        panels.push({ label: "Comunicação", path: "/ascom", icon: "bullhorn" });
      } else {
        panels.push({ label: "Secretário", path: "/painel-secretario", icon: "briefcase" });
      }
    }
    if (roleData?.isProfessor) {
      panels.push({ label: "Professor", path: "/painel-professor", icon: "chalkboard-teacher" });
    }
    if (roleData?.isAluno) {
      panels.push({ label: "Aluno", path: "/painel-aluno", icon: "graduation-cap" });
    }
    if (roleData?.isPai) {
      panels.push({ label: "Responsável", path: "/painel-pais", icon: "users" });
    }

    return panels;
  };

  const getDefaultPanel = () => {
    const panels = getRolePanels();
    return panels.length > 0 ? panels[0].path : "/";
  };

  return {
    rolePanels: getRolePanels(),
    defaultPanel: getDefaultPanel(),
    hasRoles: roleData ? roleData.roles.length > 0 : false,
    secretaryAssignment,
  };
};
