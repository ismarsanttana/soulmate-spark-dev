import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

interface TeamMember {
  name: string;
  email: string;
  role: "MASTER" | "TEAM";
  joinedAt: string;
}

export function TeamCard() {
  const team: TeamMember[] = [];

  const getRoleBadge = (role: TeamMember["role"]) => {
    switch (role) {
      case "MASTER":
        return <Badge variant="default">Superadmin</Badge>;
      case "TEAM":
        return <Badge variant="secondary">Equipe</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Equipe Interna
        </CardTitle>
        <Button size="icon" variant="outline" data-testid="button-add-team-member">
          <Plus className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {team.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30"
              data-testid={`team-member-${index}`}
            >
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-xs text-muted-foreground">
                  {member.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  Entrou {member.joinedAt}
                </span>
              </div>
              {getRoleBadge(member.role)}
            </div>
          ))}
          {team.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum membro da equipe cadastrado
              </p>
              <Button variant="outline" data-testid="button-add-first-member">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Membro
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
