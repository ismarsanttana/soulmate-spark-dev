import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface OrcamentoTabProps {
  secretariaSlug: string;
}

export default function OrcamentoTab({ secretariaSlug }: OrcamentoTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Orçamento Educação</h3>
        <p className="text-sm text-muted-foreground">
          Dados de execução orçamentária da função educação (SIOPE/FUNDEB)
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta seção está em desenvolvimento. Em breve você poderá acessar dados de receitas,
          despesas, FUNDEB, PDDE e outros programas educacionais.
        </AlertDescription>
      </Alert>

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