import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import afogadosImage from "@/assets/afogados_da_ingazeira_pe.png";
import { getIconComponent } from "@/lib/iconMapper";
import { StoryViewer } from "@/components/StoryViewer";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
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

  const { data: news } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(2);
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(2);
      return data || [];
    },
  });

  const { data: secretarias } = useQuery({
    queryKey: ["secretarias"],
    queryFn: async () => {
      const { data } = await supabase
        .from("secretarias")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .limit(6);
      return data || [];
    },
  });

  const { data: stories } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const userInitials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2) || "U";

  const SecretariasGrid = () => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Secretarias & Serviços</h2>
        <Link to="/servicos" className="text-xs text-primary font-medium">
          Ver todas
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {secretarias?.map((secretaria) => {
          const IconComponent = getIconComponent(secretaria.icon);
          
          return (
            <Link
              key={secretaria.id}
              to={`/secretarias/${secretaria.slug}`}
              className="service-btn rounded-2xl p-3 text-center cursor-pointer card-hover"
              style={{ 
                backgroundColor: `${secretaria.color}15`,
                color: secretaria.color 
              }}
            >
              <div 
                className="bg-card h-10 w-10 mx-auto mb-2 rounded-xl flex items-center justify-center"
                style={{ color: secretaria.color }}
              >
                <IconComponent className="service-icon h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{secretaria.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <Layout>
      <Header />

      {/* Assistente Virtual */}
      <div className="mb-5 bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary text-white h-10 w-10 rounded-xl flex items-center justify-center">
            <i className="fas fa-robot text-lg"></i>
          </div>
          <div>
            <p className="font-semibold text-sm">Assistente Virtual</p>
            <p className="text-xs text-muted-foreground">
              Pergunte sobre serviços de Afogados da Ingazeira
            </p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-3 text-sm mb-3">
          <p>
            <strong>👋 Olá, cidadão!</strong>
            <br />
            Pergunte sobre secretarias, horários de atendimento, protocolos e mais.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Digite sua pergunta..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            className="absolute right-2 top-1.5 text-primary"
            aria-label="Enviar"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Stories de Notícias */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-semibold">Atualizações da Prefeitura</h2>
          <Link to="/noticias" className="text-[11px] font-semibold text-primary">
            Ver tudo
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {stories && stories.length > 0 ? (
            stories.map((story, index) => (
              <article key={story.id} className="shrink-0 w-24">
                <button
                  onClick={() => {
                    setSelectedStoryIndex(index);
                    setStoryViewerOpen(true);
                  }}
                  className="group block text-center space-y-2 cursor-pointer"
                >
                  <div className="relative w-24 h-24 mx-auto rounded-full border-4 border-primary/70 p-1 bg-card overflow-hidden">
                    <img 
                      src={story.media_url} 
                      alt={story.title}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-semibold group-hover:underline line-clamp-2">
                    {story.title}
                  </p>
                </button>
              </article>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm w-full">
              Nenhum story disponível no momento
            </div>
          )}
        </div>
      </section>

      {/* Imagem da Cidade */}
      <div className="mb-5 overflow-hidden rounded-2xl shadow-md card-hover">
        <img 
          src={afogadosImage} 
          alt="Afogados da Ingazeira - PE" 
          className="w-full h-auto"
        />
      </div>

      {/* Secretarias Dinâmicas */}
      <SecretariasGrid />

      {/* Banner de Campanha */}
      <div className="mb-5 overflow-hidden rounded-2xl shadow-md card-hover">
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
            <i className="fas fa-syringe text-white text-4xl"></i>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
            <h3 className="font-semibold">Campanha de Vacinação Contra Gripe</h3>
            <p className="text-xs mt-0.5">
              Procure a unidade de saúde mais próxima
            </p>
          </div>
        </div>
      </div>

      {/* Ouvidoria */}
      <div className="mb-5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl p-4 shadow-sm card-hover">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl">
            <i className="fas fa-comment-dots"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">
              Ouvidoria Municipal
            </h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Registre sugestões, denúncias, elogios e acompanhe seus protocolos.
            </p>
            <div className="flex gap-2 mt-3">
              <Link
                to="/ouvidoria"
                className="bg-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm"
              >
                Nova manifestação
              </Link>
              <Link
                to="/ouvidoria"
                className="bg-white dark:bg-amber-800/50 text-amber-900 dark:text-amber-200 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm"
              >
                Acompanhar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Notícias */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Notícias da Prefeitura</h2>
          <Link to="/noticias" className="text-xs text-primary font-medium">
            Ver mais
          </Link>
        </div>
        <div className="space-y-3">
          {news?.map((item) => (
            <Link
              key={item.id}
              to={`/noticia/${item.id}`}
              className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block"
            >
              <div className="flex gap-3">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <span className="text-xs font-semibold text-primary uppercase">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-semibold mt-0.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.summary}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Agenda */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Agenda da Cidade</h2>
          <Link to="/agenda" className="text-xs text-primary font-medium">
            Calendário
          </Link>
        </div>
        <div className="space-y-3">
          {events?.map((event) => {
            const eventDate = new Date(event.event_date);
            const month = eventDate
              .toLocaleDateString("pt-BR", { month: "short" })
              .toUpperCase();
            const day = eventDate.getDate();

            return (
              <div
                key={event.id}
                className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary h-12 w-12 flex flex-col items-center justify-center rounded-xl flex-shrink-0">
                    <span className="text-xs font-semibold">{month}</span>
                    <span className="font-bold -mt-1">{day}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {stories && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          open={storyViewerOpen}
          onOpenChange={setStoryViewerOpen}
        />
      )}
    </Layout>
  );
};

export default Index;
