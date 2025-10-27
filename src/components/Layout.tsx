import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ControlCenter } from "./ControlCenter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [user, setUser] = useState<User | null>(null);

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const userInitials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ControlCenter />
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
              to="/expo-agro"
              className={`flex flex-col items-center p-2 transition ${
                isActive("/expo-agro") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                  isActive("/expo-agro")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                <i className="fas fa-tractor text-sm"></i>
              </div>
              <span className="text-xs font-medium mt-1">Expo Agro</span>
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
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition overflow-hidden ${
                  isActive("/perfil")
                    ? "bg-primary/10"
                    : "bg-muted dark:bg-muted"
                }`}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Usuário"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user ? (
                    <div className="h-full w-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {userInitials}
                    </div>
                  ) : (
                    <i className="fas fa-user text-sm"></i>
                  )
                )}
              </div>
              <span className="text-xs font-medium mt-1">Meu Perfil</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
};
