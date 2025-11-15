import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function RequestsChart() {
  const data = [
    { day: "Seg", requests: 245 },
    { day: "Ter", requests: 312 },
    { day: "Qua", requests: 428 },
    { day: "Qui", requests: 387 },
    { day: "Sex", requests: 521 },
    { day: "Sáb", requests: 198 },
    { day: "Dom", requests: 156 },
  ];

  const maxRequests = Math.max(...data.map((d) => d.requests));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Requisições API (Última Semana)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-48">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 flex-1"
              data-testid={`chart-bar-${index}`}
            >
              <div className="flex flex-col items-center gap-1 flex-1 justify-end w-full">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.requests}
                </span>
                <div
                  className="w-full bg-primary rounded-t-md transition-all hover-elevate"
                  style={{
                    height: `${(item.requests / maxRequests) * 100}%`,
                    minHeight: "20px",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {item.day}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">2,247</span>{" "}
            requisições
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
