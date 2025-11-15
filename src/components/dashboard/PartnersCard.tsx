import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Handshake, Plus } from "lucide-react";

interface Partner {
  name: string;
  email: string;
  company: string;
  cities: string[];
  joinedAt: string;
}

export function PartnersCard() {
  const partners: Partner[] = [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Handshake className="w-5 h-5" />
          Parceiros Comerciais
        </CardTitle>
        <Button size="icon" variant="outline" data-testid="button-add-partner">
          <Plus className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30"
              data-testid={`partner-${index}`}
            >
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{partner.name}</span>
                  <Badge variant="secondary">{partner.company}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {partner.email}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Cidades: {partner.cities.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {partners.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum parceiro comercial cadastrado
              </p>
              <Button variant="outline" data-testid="button-add-first-partner">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Parceiro
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
