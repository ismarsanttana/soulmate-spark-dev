import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SchoolSelector from "./SchoolSelector";

interface IdebAvaliacoesTabProps {
  secretariaSlug: string;
}

export default function IdebAvaliacoesTab({ secretariaSlug }: IdebAvaliacoesTabProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data: selectedSchool } = useQuery({
    queryKey: ["school", selectedSchoolId],
    enabled: !!selectedSchoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", selectedSchoolId!)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: idebData, isLoading: loadingIdeb } = useQuery({
    queryKey: ["ideb-school", selectedSchool?.codigo_inep],
    enabled: !!selectedSchool?.codigo_inep,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideb_data")
        .select("*")
        .eq("codigo_inep", selectedSchool!.codigo_inep)
        .order("ano", { ascending: true });
      
      if (error) throw error;
      
      // Preparar dados para gráfico
      const chartData = data.map(item => ({
        ano: item.ano,
        anos_iniciais: item.nota_anos_iniciais ? parseFloat(item.nota_anos_iniciais.toString()) : null,
        anos_finais: item.nota_anos_finais ? parseFloat(item.nota_anos_finais.toString()) : null,
        ensino_medio: item.nota_ensino_medio ? parseFloat(item.nota_ensino_medio.toString()) : null
      }));
      
      return { raw: data, chartData };
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSchool?.codigo_inep) {
        throw new Error("Selecione uma escola primeiro");
      }

      const { data, error } = await supabase.functions.invoke('ideb-api', {
        body: { 
          action: 'get-ideb-school',
          codigo_inep: selectedSchool.codigo_inep
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.warning) {
        toast.info(data.warning);
      } else {
        toast.success("Dados IDEB sincronizados com sucesso!");
      }
      queryClient.invalidateQueries({ queryKey: ["ideb-school"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">IDEB & Avaliações</h3>
        <p className="text-sm text-muted-foreground">
          Indicadores de Desenvolvimento da Educação Básica
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Escola</CardTitle>
          <CardDescription>
            Escolha a escola para sincronizar dados do IDEB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SchoolSelector
            value={selectedSchoolId}
            onValueChange={setSelectedSchoolId}
            label="Escola"
          />
          
          {selectedSchool && (
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium">Escola Selecionada:</p>
                <p className="text-sm text-muted-foreground">{selectedSchool.nome_escola}</p>
                <p className="text-xs text-muted-foreground font-mono">INEP: {selectedSchool.codigo_inep}</p>
              </div>
              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || !selectedSchoolId}
                className="ml-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar IDEB
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!idebData || idebData.raw.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {selectedSchoolId 
                ? "Nenhum dado IDEB disponível para esta escola. Sincronize para carregar os dados."
                : "Selecione uma escola para visualizar os dados do IDEB."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Evolução IDEB da Escola</CardTitle>
              <CardDescription>
                Histórico de notas ao longo dos anos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={idebData.chartData}>
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
                  {idebData.chartData.some((d: any) => d.ensino_medio) && (
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
              <CardTitle>Histórico Completo</CardTitle>
              <CardDescription>
                Todas as avaliações IDEB registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-center">Anos Iniciais</TableHead>
                    <TableHead className="text-center">Anos Finais</TableHead>
                    <TableHead className="text-center">Ensino Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idebData.raw.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.ano}</TableCell>
                      <TableCell className="text-center">
                        {item.nota_anos_iniciais ? (
                          <Badge variant="outline">{parseFloat(item.nota_anos_iniciais).toFixed(1)}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.nota_anos_finais ? (
                          <Badge variant="outline">{parseFloat(item.nota_anos_finais).toFixed(1)}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.nota_ensino_medio ? (
                          <Badge variant="outline">{parseFloat(item.nota_ensino_medio).toFixed(1)}</Badge>
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