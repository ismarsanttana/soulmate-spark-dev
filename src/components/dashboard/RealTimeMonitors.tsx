import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface MonitorItem {
  service: string;
  status: "operational" | "degraded" | "down";
  responseTime: string;
  lastCheck: string;
}

export function RealTimeMonitors() {
  const monitors: MonitorItem[] = [
    {
      service: "Supabase Control Plane",
      status: "operational",
      responseTime: "45ms",
      lastCheck: "Há 30 segundos",
    },
    {
      service: "Neon Data Plane (Afogados)",
      status: "operational",
      responseTime: "62ms",
      lastCheck: "Há 30 segundos",
    },
    {
      service: "Migration CLI",
      status: "operational",
      responseTime: "N/A",
      lastCheck: "Disponível",
    },
  ];

  const getStatusIcon = (status: MonitorItem["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "down":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: MonitorItem["status"]) => {
    switch (status) {
      case "operational":
        return <Badge variant="default">Operacional</Badge>;
      case "degraded":
        return <Badge variant="outline">Degradado</Badge>;
      case "down":
        return <Badge variant="outline">Offline</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Monitoramento em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monitors.map((monitor, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30"
              data-testid={`monitor-item-${index}`}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(monitor.status)}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{monitor.service}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {monitor.lastCheck}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {monitor.responseTime}
                </span>
                {getStatusBadge(monitor.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
