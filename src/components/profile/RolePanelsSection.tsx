import { Link } from "react-router-dom";
import { useRoleNavigation } from "@/hooks/useRoleNavigation";

const iconColorClasses: Record<string, { bg: string; text: string }> = {
  "shield-alt": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  "landmark": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "briefcase": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "chalkboard-teacher": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  "graduation-cap": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "users": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
};

export const RolePanelsSection = () => {
  const { rolePanels } = useRoleNavigation();

  if (rolePanels.length === 0) {
    return null;
  }

  return (
    <section className="bg-card dark:bg-card rounded-2xl p-5 shadow-sm mb-5 card-hover border border-border">
      <div className="mb-4">
        <h2 className="font-semibold text-lg">Meus Painéis</h2>
        <p className="text-xs text-muted-foreground">
          Acesse os painéis administrativos disponíveis para você.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rolePanels.map((panel) => {
          const colors = iconColorClasses[panel.icon] || { 
            bg: "bg-primary/10", 
            text: "text-primary" 
          };
          
          return (
            <Link
              key={panel.path}
              to={panel.path}
              className="group bg-muted/40 dark:bg-muted/20 rounded-2xl p-4 border border-border hover:border-primary transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className={`${colors.bg} ${colors.text} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  <i className={`fas fa-${panel.icon} text-lg`}></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-0.5">
                    Acessar Painel {panel.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gerencie suas atividades
                  </p>
                </div>
                <i className="fas fa-arrow-right text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"></i>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
