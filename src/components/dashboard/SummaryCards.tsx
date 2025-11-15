import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Database, Users, Activity } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

function SummaryCard({ title, value, icon, description }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  const cards: SummaryCardProps[] = [
    {
      title: "Municípios Ativos",
      value: 1,
      icon: <Building2 className="w-4 h-4" />,
      description: "Afogados da Ingazeira em produção",
    },
    {
      title: "Databases (Data Plane)",
      value: 1,
      icon: <Database className="w-4 h-4" />,
      description: "Neon PostgreSQL instâncias",
    },
    {
      title: "Usuários Plataforma",
      value: 0,
      icon: <Users className="w-4 h-4" />,
      description: "MASTER + TEAM + PARTNER",
    },
    {
      title: "Uptime",
      value: "99.9%",
      icon: <Activity className="w-4 h-4" />,
      description: "Últimos 30 dias",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <SummaryCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          description={card.description}
        />
      ))}
    </div>
  );
}
