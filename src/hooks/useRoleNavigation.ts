import { useUserRole } from "./useUserRole";

export const useRoleNavigation = () => {
  const { data: roleData } = useUserRole();

  const getRolePanels = () => {
    const panels: { label: string; path: string; icon: string }[] = [];

    if (roleData?.isAdmin) {
      panels.push({ label: "Admin", path: "/admin", icon: "shield-alt" });
    }
    if (roleData?.isPrefeito) {
      panels.push({ label: "Prefeito", path: "/painel-prefeito", icon: "landmark" });
    }
    if (roleData?.isSecretario) {
      panels.push({ label: "Secretário", path: "/painel-secretario", icon: "briefcase" });
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
  };
};
