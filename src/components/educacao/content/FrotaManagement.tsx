import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FrotaManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Frota</h2>
        <p className="text-muted-foreground">
          Gerenciamento de veículos e transporte escolar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Em Construção
          </CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo desenvolvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O módulo de Frota estará disponível em breve. Aqui você poderá gerenciar
            todos os veículos, rotas de transporte escolar, manutenções e documentações.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
