import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, DollarSign } from "lucide-react";

interface TransparenciaTabProps {
  secretariaSlug: string;
}

export default function TransparenciaTab({ secretariaSlug }: TransparenciaTabProps) {
  const [ano] = useState(new Date().getFullYear());

  const { data: transferencias, isLoading } = useQuery({
    queryKey: ["transferencias-federais", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transferencias_federais")
        .select("*")
        .eq("ano", ano)
        .order("mes", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const totalPorPrograma = transferencias?.reduce((acc: any, t) => {
    if (!acc[t.programa]) {
      acc[t.programa] = { total: 0, count: 0 };
    }
    acc[t.programa].total += parseFloat(t.valor?.toString() || "0") || 0;
    acc[t.programa].count += 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Portal da Transparência</h3>
        <p className="text-sm text-muted-foreground">
          Transferências federais e convênios para educação
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Para sincronizar dados do Portal da Transparência, é necessário configurar
          a chave de API. Solicite sua chave em{" "}
          <a 
            href="https://api.portaldatransparencia.gov.br/" 
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            api.portaldatransparencia.gov.br
          </a>
        </AlertDescription>
      </Alert>

      {!transferencias || transferencias.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhuma transferência registrada. Configure a API key e sincronize os dados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(totalPorPrograma || {}).map(([programa, info]: any) => (
              <Card key={programa}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{programa}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(info.total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {info.count} transferências
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transferências Recentes</CardTitle>
              <CardDescription>Últimas transferências federais recebidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transferencias.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t.programa}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {t.mes}/{t.ano}
                        </Badge>
                        {t.favorecido && (
                          <span className="text-xs text-muted-foreground">{t.favorecido}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(parseFloat(t.valor?.toString() || "0") || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}