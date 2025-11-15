import { Badge } from "@/components/ui/badge";
import { Cloud, Database, Globe, Zap } from "lucide-react";

interface ContextItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: "default" | "secondary" | "outline";
}

export function ContextBar() {
  const contextItems: ContextItem[] = [
    {
      icon: <Database className="w-4 h-4" />,
      label: "Control Plane",
      value: "Supabase",
      variant: "default",
    },
    {
      icon: <Cloud className="w-4 h-4" />,
      label: "Data Plane",
      value: "Neon PostgreSQL",
      variant: "secondary",
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: "Environment",
      value: "Production",
      variant: "outline",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Status",
      value: "Operational",
      variant: "default",
    },
  ];

  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-muted/30 border-b overflow-x-auto">
      {contextItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {item.icon}
            <span className="font-medium">{item.label}:</span>
          </span>
          <Badge variant={item.variant} data-testid={`badge-context-${index}`}>
            {item.value}
          </Badge>
          {index < contextItems.length - 1 && (
            <span className="text-muted-foreground mx-1">•</span>
          )}
        </div>
      ))}
    </div>
  );
}
