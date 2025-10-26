import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { FloatingThemeToggle } from "./FloatingThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FloatingThemeToggle />
      <div className="max-w-md mx-auto px-4 py-6">
        {children}

        {/* Navegação inferior */}
        <div className="h-16"></div>
        <nav className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-50">
          <div className="bg-card dark:bg-card rounded-2xl p-2 shadow-lg flex justify-around items-center border border-border">
            <Link
              to="/"
              className={`flex flex-col items-center p-2 transition ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                  isActive("/")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                <i className="fas fa-home text-sm"></i>
              </div>
              <span className="text-xs font-medium mt-1">Início</span>
            </Link>

            <Link
              to="/servicos"
              className={`flex flex-col items-center p-2 transition ${
                isActive("/servicos") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                  isActive("/servicos")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                <i className="fas fa-concierge-bell text-sm"></i>
              </div>
              <span className="text-xs font-medium mt-1">Serviços</span>
            </Link>

            <Link
              to="/ouvidoria"
              className={`flex flex-col items-center p-2 transition ${
                isActive("/ouvidoria") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                  isActive("/ouvidoria")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                <i className="fas fa-plus text-sm"></i>
              </div>
              <span className="text-xs font-medium mt-1">Novo</span>
            </Link>

            <Link
              to="/noticias"
              className={`flex flex-col items-center p-2 transition ${
                isActive("/noticias") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                  isActive("/noticias")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                <i className="fas fa-file-alt text-sm"></i>
              </div>
              <span className="text-xs font-medium mt-1">Notícias</span>
            </Link>

            <Link
              to="/perfil"
              className={`flex flex-col items-center p-2 transition ${
                isActive("/perfil") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                  isActive("/perfil")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                <i className="fas fa-user text-sm"></i>
              </div>
              <span className="text-xs font-medium mt-1">Meu Perfil</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
};
