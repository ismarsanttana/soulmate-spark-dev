import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, User } from "lucide-react";

interface EmployeeAuditLogProps {
  employeeId: string;
}

export function EmployeeAuditLog({ employeeId }: EmployeeAuditLogProps) {
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["employee-audit", employeeId],
    queryFn: async () => {
      // First get the audit logs
      const { data: logs, error: logsError } = await supabase
        .from("employee_audit_log")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      // Then get the profiles for the changed_by users
      const userIds = [...new Set(logs?.map(log => log.changed_by).filter(Boolean))];
      if (userIds.length === 0) return logs || [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]));
      return logs?.map(log => ({
        ...log,
        changed_by_profile: { full_name: profileMap.get(log.changed_by) || "Sistema" }
      })) || [];
    },
    enabled: !!employeeId,
  });

  const getActionLabel = (action: string) => {
    switch (action) {
      case "INSERT":
        return "Criação";
      case "UPDATE":
        return "Atualização";
      case "DELETE":
        return "Exclusão";
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "DELETE":
        return "bg-red-500/10 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      full_name: "Nome Completo",
      cpf: "CPF",
      funcao: "Função",
      email: "E-mail",
      phone: "Telefone",
      situacao: "Situação",
      salario: "Salário",
      jornada: "Jornada",
      created: "Cadastro Criado",
    };
    return labels[field] || field;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription>
          Registro de todas as modificações feitas no cadastro deste funcionário
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma alteração registrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log: any) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Badge className={getActionColor(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Alterado por:{" "}
                    <span className="font-medium text-foreground">
                      {log.changed_by_profile?.full_name || "Sistema"}
                    </span>
                  </span>
                </div>

                {log.changed_fields && Object.keys(log.changed_fields).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Campos alterados:</p>
                    <div className="space-y-1 pl-4">
                      {Object.keys(log.changed_fields).map((field) => (
                        <div key={field} className="text-sm">
                          <span className="font-medium">{getFieldLabel(field)}:</span>
                          {log.old_values && log.old_values[field] !== undefined && (
                            <>
                              <span className="text-muted-foreground mx-2">
                                de "{log.old_values[field] || '(vazio)'}"
                              </span>
                              <span className="text-muted-foreground mx-1">→</span>
                            </>
                          )}
                          {log.new_values && log.new_values[field] !== undefined && (
                            <span className="text-primary font-medium">
                              para "{log.new_values[field]}"
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
