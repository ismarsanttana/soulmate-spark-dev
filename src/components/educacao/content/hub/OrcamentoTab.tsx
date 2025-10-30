import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, Info, DollarSign } from "lucide-react";
import SchoolSelector from "./SchoolSelector";

interface OrcamentoTabProps {
  secretariaSlug: string;
}

export default function OrcamentoTab({ secretariaSlug }: OrcamentoTabProps) {
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

  const { data: orcamento, isLoading: loadingOrcamento } = useQuery({
    queryKey: ["orcamento", selectedSchool?.codigo_inep],
    enabled: !!selectedSchool?.codigo_inep,
    queryFn: async () => {
      // Buscar dados orçamentários relacionados ao município ou escola
      // Por enquanto, busca todos até implementar filtro específico
      const { data, error } = await supabase
        .from("orcamento_educacao")
        .select("*")
        .order("ano", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Retorna vazio se não houver dados - normal, pois ainda não foram sincronizados
      return data || [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSchool?.codigo_inep) {
        throw new Error("Selecione uma escola primeiro");
      }

      // Por enquanto, retorna mensagem informativa
      // Futuramente conectar com SIOPE API
      return {
        message: "Sincronização de orçamento será implementada quando a API SIOPE estiver disponível"
      };
    },
    onSuccess: () => {
      toast.info("Funcionalidade em desenvolvimento", {
        description: "A sincronização de dados orçamentários do SIOPE será implementada em breve."
      });
      queryClient.invalidateQueries({ queryKey: ["orcamento"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Orçamento Educação</h3>
        <p className="text-sm text-muted-foreground">
          Dados de execução orçamentária da função educação (SIOPE/FUNDEB)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Escola</CardTitle>
          <CardDescription>
            Escolha a escola para sincronizar dados orçamentários
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
                Sincronizar Orçamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta seção está em desenvolvimento. Em breve você poderá acessar dados de receitas,
          despesas, FUNDEB, PDDE e outros programas educacionais diretamente do SIOPE.
        </AlertDescription>
      </Alert>

      {orcamento && orcamento.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Dados Orçamentários</CardTitle>
            <CardDescription>
              Histórico de execução orçamentária cadastrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ano</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">% Exec.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamento.slice(0, 20).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.ano}</TableCell>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell className="capitalize">{item.tipo}</TableCell>
                    <TableCell>{item.fonte}</TableCell>
                    <TableCell className="text-right">
                      {item.valor_previsto ? `R$ ${parseFloat(item.valor_previsto).toLocaleString('pt-BR')}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.valor_realizado ? `R$ ${parseFloat(item.valor_realizado).toLocaleString('pt-BR')}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.percentual_executado ? `${parseFloat(item.percentual_executado).toFixed(1)}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : selectedSchoolId && !loadingOrcamento ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum dado orçamentário disponível para esta escola. 
              Clique em "Sincronizar Orçamento" para buscar os dados.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Previstas</CardTitle>
          <CardDescription>
            Integrações que estarão disponíveis nesta aba
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• <strong>SIOPE:</strong> Receitas e despesas da educação municipal</li>
            <li>• <strong>FUNDEB:</strong> Valores recebidos e aplicados</li>
            <li>• <strong>PDDE:</strong> Programa Dinheiro Direto na Escola</li>
            <li>• <strong>PNAE:</strong> Alimentação Escolar</li>
            <li>• <strong>PNATE:</strong> Transporte Escolar</li>
            <li>• <strong>Indicadores:</strong> % aplicado, cumprimento do mínimo constitucional</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}