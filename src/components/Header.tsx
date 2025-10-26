import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  pageTitle?: string;
}

export const Header = ({ pageTitle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .single();
      return data;
    },
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const userInitials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2) || "U";

  const firstName = profile?.full_name?.split(" ")[0] || "Cidadão";

  return (
    <>
      <div className="bg-gradient-to-br from-primary to-blue-700 text-white rounded-2xl p-5 shadow-lg mb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {appSettings?.logo_url ? (
              <img
                src={appSettings.logo_url}
                alt={appSettings.app_name}
                className="h-12 w-auto rounded-lg object-contain"
              />
            ) : (
              <img
                src="https://afogadosdaingazeira.pe.gov.br/img/logo_afogados.png"
                alt="Prefeitura de Afogados da Ingazeira"
                className="h-12 w-auto bg-white p-1 rounded-lg"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{appSettings?.app_name || "Conecta Afogados"}</h1>
              <p className="text-xs opacity-90">
                {pageTitle ? `${pageTitle} • ` : ""}Prefeitura de Afogados da Ingazeira-PE
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <i className="fas fa-sun"></i>
            <span>29°C - Ensolarado</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="far fa-calendar"></i>
            <span>{formatDate(currentDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="far fa-clock"></i>
            <span>{formatTime(currentDate)}</span>
          </div>
        </div>

        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Buscar serviços, protocolos, notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white/90 text-gray-900 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <i className="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
        </div>
      </div>

      {/* Notificações e Área do Usuário */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link
          to={user ? "/notificacoes" : "/auth"}
          className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                <i className="fas fa-bell"></i>
              </div>
              {notifications && notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                  {notifications.length}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">Notificações</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notifications && notifications.length > 0
                  ? `${notifications.length} ${notifications.length === 1 ? "nova" : "novas"}`
                  : "Nenhuma nova"}
              </p>
            </div>
          </div>
        </Link>

        <Link
          to={user ? "/perfil" : "/auth"}
          className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-semibold">
              {userInitials}
            </div>
            <div>
              <p className="text-sm font-semibold">{firstName}</p>
              <p className="text-xs text-muted-foreground">
                {user ? "Área do usuário" : "Faça login"}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
};
