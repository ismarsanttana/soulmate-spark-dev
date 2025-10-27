import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

const NoticiaDetalhes = () => {
  const { id } = useParams<{ id: string }>();

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  return (
    <Layout>
      <Header pageTitle="Notícia" />

      <div className="mb-4">
        <Link to="/noticias">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para notícias
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-64 bg-muted rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : news ? (
        <article>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{news.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(news.published_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              <h1 className="text-2xl font-bold mb-4">{news.title}</h1>

              {news.image_url && (
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="w-full h-auto rounded-xl mb-6 object-cover max-h-96"
                />
              )}

              <p className="text-lg text-muted-foreground font-medium mb-6 leading-relaxed">
                {news.summary}
              </p>

              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {news.content}
              </div>

              {news.gallery_images && Array.isArray(news.gallery_images) && news.gallery_images.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Galeria de Fotos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {news.gallery_images.map((imageUrl: string, index: number) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${news.title} - Foto ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Link to="/noticias">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver mais notícias
              </Button>
            </Link>
          </div>
        </article>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <i className="fas fa-newspaper text-4xl mb-4 block" />
              <p className="text-lg font-semibold mb-2">Notícia não encontrada</p>
              <p className="text-sm mb-4">
                A notícia que você está procurando não existe ou foi removida.
              </p>
              <Link to="/noticias">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para notícias
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default NoticiaDetalhes;
