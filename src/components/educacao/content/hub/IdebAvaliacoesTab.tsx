import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface IdebAvaliacoesTabProps {
  secretariaSlug: string;
}

export default function IdebAvaliacoesTab({ secretariaSlug }: IdebAvaliacoesTabProps) {
  const queryClient = useQueryClient();
  
  const { data: idebMunicipal, isLoading: loadingIdeb } = useQuery({
    queryKey: ["ideb-municipal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideb_data")
        .select("*")
        .order("ano", { ascending: true });
      
      if (error) throw error;
      
      // Agrupar por ano
      const byYear = data.reduce((acc: any, item) => {
        if (!acc[item.ano]) acc[item.ano] = [];
        acc[item.ano].push(item);
        return acc;
      }, {});
      
      // Calcular médias por ano
      const chartData = Object.keys(byYear).map(ano => {
        const items = byYear[ano];
        const calcAvg = (field: string) => {
          const values = items.filter((i: any) => i[field]).map((i: any) => parseFloat(i[field]));
          return values.length > 0 ? (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1) : null;
        };
        
        return {
          ano: parseInt(ano),
          anos_iniciais: calcAvg('nota_anos_iniciais'),
          anos_finais: calcAvg('nota_anos_finais'),
          ensino_medio: calcAvg('nota_ensino_medio')
        };
      });
      
      return { raw: data, chartData };
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ideb-api', {
        body: { 
          action: 'get-ideb-municipality',
          municipio_ibge: '2600807', // Afogados da Ingazeira
          ano: 2023
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Dados IDEB sincronizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["ideb-municipal"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">IDEB & Avaliações</h3>
          <p className="text-sm text-muted-foreground">
            Indicadores de Desenvolvimento da Educação Básica
          </p>
        </div>
        <Button 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      {!idebMunicipal || idebMunicipal.raw.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum dado IDEB disponível. Sincronize para carregar os dados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Evolução IDEB Municipal</CardTitle>
              <CardDescription>
                Médias das escolas do município ao longo dos anos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={idebMunicipal.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="anos_iniciais" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Anos Iniciais"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="anos_finais" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Anos Finais"
                  />
                  {idebMunicipal.chartData.some((d: any) => d.ensino_medio) && (
                    <Line 
                      type="monotone" 
                      dataKey="ensino_medio" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      name="Ensino Médio"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados por Escola</CardTitle>
              <CardDescription>
                IDEB 2023 por escola cadastrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código INEP</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-center">Anos Iniciais</TableHead>
                    <TableHead className="text-center">Anos Finais</TableHead>
                    <TableHead className="text-center">Ensino Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idebMunicipal.raw.slice(0, 20).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.codigo_inep}</TableCell>
                      <TableCell>{item.ano}</TableCell>
                      <TableCell className="text-center">
                        {item.nota_anos_iniciais ? (
                          <Badge variant="outline">{item.nota_anos_iniciais}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.nota_anos_finais ? (
                          <Badge variant="outline">{item.nota_anos_finais}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.nota_ensino_medio ? (
                          <Badge variant="outline">{item.nota_ensino_medio}</Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}