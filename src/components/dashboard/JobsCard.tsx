import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Job {
  id: string;
  type: "migration" | "sync" | "backup";
  city: string;
  status: "running" | "completed" | "failed" | "queued";
  startedAt: string;
  duration?: string;
}

export function JobsCard() {
  const jobs: Job[] = [
    {
      id: "job-001",
      type: "sync",
      city: "Afogados da Ingazeira",
      status: "completed",
      startedAt: "Há 10 minutos",
      duration: "2.3s",
    },
    {
      id: "job-002",
      type: "backup",
      city: "Afogados da Ingazeira",
      status: "completed",
      startedAt: "Há 1 hora",
      duration: "15.7s",
    },
  ];

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "queued":
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "running":
        return <Badge variant="default">Executando</Badge>;
      case "completed":
        return <Badge variant="default">Concluído</Badge>;
      case "failed":
        return <Badge variant="outline">Falhou</Badge>;
      case "queued":
        return <Badge variant="outline">Na Fila</Badge>;
    }
  };

  const getTypeLabel = (type: Job["type"]) => {
    switch (type) {
      case "migration":
        return "Migração";
      case "sync":
        return "Sincronização";
      case "backup":
        return "Backup";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Jobs Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map((job, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30"
              data-testid={`job-item-${index}`}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(job.status)}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getTypeLabel(job.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {job.city}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {job.startedAt}
                    {job.duration && ` • ${job.duration}`}
                  </span>
                </div>
              </div>
              {getStatusBadge(job.status)}
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum job recente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
