import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { X } from "lucide-react";

interface HeaderProps {
  pageTitle?: string;
}

export const Header = ({ pageTitle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

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

  // Busca em tempo real
  const { data: searchNews } = useQuery({
    queryKey: ["search-news", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data } = await supabase
        .from("news")
        .select("*")
        .or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .eq("status", "published")
        .limit(3);
      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: searchProtocols } = useQuery({
    queryKey: ["search-protocols", searchQuery, user?.id],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2 || !user) return [];
      const { data } = await supabase
        .from("ombudsman_protocols")
        .select("*")
        .eq("user_id", user.id)
        .or(`protocol_number.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(3);
      return data || [];
    },
    enabled: searchQuery.length >= 2 && !!user,
  });

  const { data: searchEvents } = useQuery({
    queryKey: ["search-events", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data } = await supabase
        .from("city_agenda")
        .select("*")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
        .eq("status", "published")
        .limit(3);
      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: searchAppointments } = useQuery({
    queryKey: ["search-appointments", searchQuery, user?.id],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2 || !user) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .or(`specialty.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)
        .limit(3);
      return data || [];
    },
    enabled: searchQuery.length >= 2 && !!user,
  });

  // Serviços/Secretarias
  const services = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const allServices = [
      { name: "Agendar Consulta", slug: "/agendar-consulta", keywords: ["consulta", "médico", "saúde", "agendamento"] },
      { name: "Secretaria de Saúde", slug: "/saude", keywords: ["saúde", "médico", "hospital", "ubs"] },
      { name: "Secretaria de Educação", slug: "/educacao", keywords: ["educação", "escola", "ensino", "aluno"] },
      { name: "Assistência Social", slug: "/assistencia", keywords: ["assistência", "benefício", "auxílio", "social"] },
      { name: "Ouvidoria", slug: "/ouvidoria", keywords: ["ouvidoria", "reclamação", "denúncia", "sugestão"] },
      { name: "2ª via IPTU", slug: "/iptu", keywords: ["iptu", "imposto", "segunda via", "pagamento"] },
      { name: "Iluminação Pública", slug: "/iluminacao-publica", keywords: ["iluminação", "luz", "poste", "rua"] },
      { name: "Obras", slug: "/obras", keywords: ["obras", "construção", "infraestrutura"] },
      { name: "Cultura", slug: "/cultura", keywords: ["cultura", "evento", "turismo", "lazer"] },
      { name: "Esporte", slug: "/esporte", keywords: ["esporte", "academia", "futebol", "quadra"] },
    ];
    
    const query = searchQuery.toLowerCase();
    return allServices.filter(service => 
      service.name.toLowerCase().includes(query) ||
      service.keywords.some(keyword => keyword.includes(query))
    ).slice(0, 3);
  }, [searchQuery]);

  const hasResults = (searchNews?.length || 0) + (searchProtocols?.length || 0) + 
                     (searchEvents?.length || 0) + (searchAppointments?.length || 0) + 
                     services.length > 0;

  useEffect(() => {
    setShowResults(searchQuery.length >= 2);
  }, [searchQuery]);

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
                Prefeitura de Afogados da Ingazeira-PE
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
            onFocus={() => setShowResults(searchQuery.length >= 2)}
            className="w-full rounded-xl bg-white/90 text-gray-900 px-4 py-3 pr-20 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              className="absolute right-10 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <i className="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>

          {/* Resultados da busca */}
          {showResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
              {!hasResults ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhum resultado encontrado
                </div>
              ) : (
                <div className="p-2">
                  {/* Serviços */}
                  {services.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Serviços</h3>
                      {services.map((service, index) => (
                        <Link
                          key={index}
                          to={service.slug}
                          onClick={() => {
                            setSearchQuery("");
                            setShowResults(false);
                          }}
                          className="block px-3 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Notícias */}
                  {searchNews && searchNews.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Notícias</h3>
                      {searchNews.map((news) => (
                        <Link
                          key={news.id}
                          to={`/noticia/${news.id}`}
                          onClick={() => {
                            setSearchQuery("");
                            setShowResults(false);
                          }}
                          className="block px-3 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <p className="text-sm font-medium text-gray-900">{news.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{news.summary}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Protocolos */}
                  {searchProtocols && searchProtocols.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Meus Protocolos</h3>
                      {searchProtocols.map((protocol) => (
                        <Link
                          key={protocol.id}
                          to="/ouvidoria"
                          onClick={() => {
                            setSearchQuery("");
                            setShowResults(false);
                          }}
                          className="block px-3 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            Protocolo #{protocol.protocol_number}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{protocol.description}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Agendamentos */}
                  {searchAppointments && searchAppointments.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Meus Agendamentos</h3>
                      {searchAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="block px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => {
                            setSearchQuery("");
                            setShowResults(false);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900">{appointment.specialty}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(appointment.preferred_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Eventos */}
                  {searchEvents && searchEvents.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Eventos</h3>
                      {searchEvents.map((event) => (
                        <div
                          key={event.id}
                          className="block px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => {
                            setSearchQuery("");
                            setShowResults(false);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {event.location} • {new Date(event.event_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Usuário"}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-semibold">
                {userInitials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">
                {user ? `Olá, ${firstName}` : "Visitante"}
              </p>
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
