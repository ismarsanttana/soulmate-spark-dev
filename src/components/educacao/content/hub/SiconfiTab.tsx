import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, DollarSign, TrendingUp } from "lucide-react";

interface SiconfiTabProps {
  secretariaSlug: string;
}

export default function SiconfiTab({ secretariaSlug }: SiconfiTabProps) {
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [bimestre, setBimestre] = useState("6");
  const queryClient = useQueryClient();

  const { data: orcamento, isLoading } = useQuery({
    queryKey: ["orcamento-siconfi", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamento_educacao")
        .select("*")
        .eq("ano", parseInt(ano))
        .eq("fonte", "siconfi")
        .order("categoria");
      
      if (error) throw error;
      return data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('siconfi-api', {
        body: { 
          action: 'get-rreo',
          codigo_ibge: '2600807', // Afogados da Ingazeira
          ano: parseInt(ano),
          bimestre: parseInt(bimestre)
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Dados SICONFI sincronizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["orcamento-siconfi"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  const totalReceitas = orcamento
    ?.filter(o => o.tipo === 'receita')
    .reduce((sum, o) => sum + (parseFloat(o.valor_realizado?.toString() || "0") || 0), 0) || 0;

  const totalDespesas = orcamento
    ?.filter(o => o.tipo === 'despesa')
    .reduce((sum, o) => sum + (parseFloat(o.valor_realizado?.toString() || "0") || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Execução Financeira (SICONFI)</h3>
          <p className="text-sm text-muted-foreground">
            Dados fiscais do Tesouro Nacional - Função 12 Educação
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sincronizar Dados</CardTitle>
          <CardDescription>
            Buscar dados da API SICONFI do Tesouro Nacional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                min="2015"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label>Bimestre</Label>
              <Select value={bimestre} onValueChange={setBimestre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                  <SelectItem value="5">5º Bimestre</SelectItem>
                  <SelectItem value="6">6º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!orcamento || orcamento.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum dado disponível. Sincronize com o SICONFI para carregar os dados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalReceitas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Função 12 - Educação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalDespesas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalReceitas > 0 ? `${((totalDespesas / totalReceitas) * 100).toFixed(1)}% executado` : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento Orçamentário</CardTitle>
              <CardDescription>Ano {ano}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Receitas</h4>
                  {orcamento.filter(o => o.tipo === 'receita').map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-sm">{item.categoria}</span>
                      <span className="font-mono text-sm">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(parseFloat(item.valor_realizado?.toString() || "0") || 0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Despesas</h4>
                  {orcamento.filter(o => o.tipo === 'despesa').map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-sm">{item.categoria}</span>
                      <span className="font-mono text-sm">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(parseFloat(item.valor_realizado?.toString() || "0") || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}