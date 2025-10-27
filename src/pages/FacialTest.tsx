import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Send, Loader2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FacialTest() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [deviceId, setDeviceId] = useState("device-test-001");
  const [logs, setLogs] = useState<any[]>([]);

  const { data: students = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          student:student_id(
            id,
            full_name
          )
        `)
        .eq("status", "active");
      return data || [];
    },
  });

  const simulateEntry = useMutation({
    mutationFn: async (type: "entrada" | "saida") => {
      const response = await fetch(
        "https://hqhjbelcouanvcrqudbj.supabase.co/functions/v1/facial-recognition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: selectedStudent,
            device_id: deviceId,
            entry_type: type,
            photo_base64: null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao simular entrada");
      }

      return response.json();
    },
    onSuccess: (data, type) => {
      toast.success(`${type === "entrada" ? "Entrada" : "Saída"} registrada com sucesso!`, {
        description: `Aluno: ${data.student} | Notificações: ${data.notifications_sent}`,
      });
      setLogs((prev) => [
        {
          timestamp: new Date().toISOString(),
          type,
          student: data.student,
          notifications: data.notifications_sent,
        },
        ...prev,
      ]);
    },
    onError: (error: any) => {
      toast.error("Erro ao simular entrada", {
        description: error.message,
      });
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Simulador de Reconhecimento Facial
            </CardTitle>
            <CardDescription>
              Use esta interface para simular identificações faciais e testar o sistema de notificações em tempo real
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Formulário de Simulação */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="space-y-2">
                <Label>Selecione o Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um aluno..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s: any) => (
                      <SelectItem key={s.student_id} value={s.student_id}>
                        {s.student?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Device ID (Leitor Facial)</Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="device-test-001">Device Test 001 (Portão Principal)</SelectItem>
                    <SelectItem value="device-test-002">Device Test 002 (Portão Fundos)</SelectItem>
                    <SelectItem value="device-test-003">Device Test 003 (Refeitório)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => simulateEntry.mutate("entrada")}
                  disabled={!selectedStudent || simulateEntry.isPending}
                  className="flex-1 gap-2"
                >
                  {simulateEntry.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Simular Entrada
                </Button>
                <Button
                  onClick={() => simulateEntry.mutate("saida")}
                  disabled={!selectedStudent || simulateEntry.isPending}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {simulateEntry.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Simular Saída
                </Button>
              </div>
            </div>

            {/* Logs de Requisições */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Logs de Requisições</h3>
                {logs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
                    Limpar
                  </Button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Nenhuma simulação realizada ainda
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{log.student}</p>
                          <Badge variant={log.type === "entrada" ? "default" : "outline"}>
                            {log.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.notifications} notificação(ões) enviada(s)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Como testar:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Selecione um aluno que tenha responsáveis cadastrados</li>
                <li>Escolha o dispositivo (leitor facial) simulado</li>
                <li>Clique em "Simular Entrada" ou "Simular Saída"</li>
                <li>Verifique se a notificação aparece no painel do responsável em tempo real</li>
                <li>Vá até o painel do professor para ver a presença sendo atualizada automaticamente</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
