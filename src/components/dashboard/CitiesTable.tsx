import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Database, ExternalLink, Settings } from "lucide-react";

interface City {
  name: string;
  slug: string;
  database: string;
  status: "active" | "maintenance" | "inactive";
  users: number;
  lastSync: string;
}

export function CitiesTable() {
  const cities: City[] = [
    {
      name: "Afogados da Ingazeira",
      slug: "afogados-da-ingazeira",
      database: "neon-afogados-prod",
      status: "active",
      users: 0,
      lastSync: "Há 5 minutos",
    },
  ];

  const getStatusBadge = (status: City["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Ativo</Badge>;
      case "maintenance":
        return <Badge variant="outline">Manutenção</Badge>;
      case "inactive":
        return <Badge variant="outline">Inativo</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Municípios Gerenciados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cities.map((city, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-4 rounded-md border bg-card hover-elevate"
              data-testid={`city-item-${index}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{city.name}</span>
                    {getStatusBadge(city.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {city.database}
                    </span>
                    <span>•</span>
                    <span>{city.users} usuários</span>
                    <span>•</span>
                    <span>{city.lastSync}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  data-testid={`button-city-settings-${index}`}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  data-testid={`button-city-visit-${index}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
