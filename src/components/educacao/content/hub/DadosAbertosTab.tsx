import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Database, ExternalLink, Download } from "lucide-react";

interface DadosAbertosTabProps {
  secretariaSlug: string;
}

export default function DadosAbertosTab({ secretariaSlug }: DadosAbertosTabProps) {
  const [searchTerm, setSearchTerm] = useState("educação");
  const [results, setResults] = useState<any>(null);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke('dados-abertos-api', {
        body: { 
          action: 'search-datasets',
          query,
          limit: 20
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(`${data.total} datasets encontrados`);
    },
    onError: (error: any) => {
      toast.error("Erro ao buscar: " + error.message);
    },
  });

  const searchInep = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('dados-abertos-api', {
        body: { action: 'search-inep-datasets' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(`${data.total} datasets do INEP encontrados`);
    },
    onError: (error: any) => {
      toast.error("Erro ao buscar: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Dados Abertos (dados.gov.br)</h3>
        <p className="text-sm text-muted-foreground">
          Catálogo unificado de datasets do governo federal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Datasets</CardTitle>
          <CardDescription>
            Pesquise no catálogo de dados abertos do governo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: censo escolar, IDEB, ENEM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMutation.mutate(searchTerm)}
            />
            <Button 
              onClick={() => searchMutation.mutate(searchTerm)}
              disabled={searchMutation.isPending}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          <Button 
            variant="outline"
            onClick={() => searchInep.mutate()}
            disabled={searchInep.isPending}
            className="w-full"
          >
            <Database className="h-4 w-4 mr-2" />
            Ver Datasets do INEP
          </Button>
        </CardContent>
      </Card>

      {results && results.datasets && results.datasets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({results.total})</CardTitle>
            <CardDescription>
              Mostrando {results.datasets.length} datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.datasets.map((dataset: any) => (
                <div key={dataset.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold">{dataset.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dataset.notes || 'Sem descrição'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {dataset.organization}
                    </Badge>
                    {dataset.resources_count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        {dataset.resources_count} recursos
                      </Badge>
                    )}
                    {dataset.tags && dataset.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {dataset.resources && dataset.resources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Recursos disponíveis:</p>
                      <div className="space-y-1">
                        {dataset.resources.slice(0, 3).map((resource: any) => (
                          <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-xs p-2 rounded hover:bg-accent"
                          >
                            <span className="flex items-center gap-2">
                              <Badge variant="outline">{resource.format}</Badge>
                              {resource.name}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.datasets && results.datasets.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum dataset encontrado para esta busca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}