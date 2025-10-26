import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComprasManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
        <p className="text-muted-foreground">
          Gerenciamento de compras e aquisições
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
            O módulo de Compras estará disponível em breve. Aqui você poderá gerenciar
            todas as aquisições, processos licitatórios e contratos da secretaria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
