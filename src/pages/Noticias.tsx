import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Noticias = () => {
  const { data: news, isLoading } = useQuery({
    queryKey: ["all-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <Layout>
      <Header pageTitle="Notícias" />

      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Notícias da Prefeitura</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe as últimas novidades de Afogados da Ingazeira
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="h-24 w-24 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : news && news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <Link key={item.id} to={`/noticia/${item.id}`}>
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-24 w-24 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.published_at), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <i className="fas fa-newspaper text-4xl mb-4 block" />
              <p className="text-lg font-semibold mb-2">Nenhuma notícia disponível</p>
              <p className="text-sm">
                As notícias da prefeitura aparecerão aqui em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default Noticias;
