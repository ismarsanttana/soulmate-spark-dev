import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Save, FileText, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateTimeclockPDF } from "@/lib/pdfGenerator";
import { Checkbox } from "@/components/ui/checkbox";

interface TimeclockManagementProps {
  secretariaSlug: string;
}

export function TimeclockManagement({ secretariaSlug }: TimeclockManagementProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [requestFullData, setRequestFullData] = useState<boolean>(false);
  
  const queryClient = useQueryClient();

  // Buscar funcionários da secretaria
  const { data: employees = [] } = useQuery({
    queryKey: ["secretaria-employees", secretariaSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_employees")
        .select("*")
        .eq("secretaria_slug", secretariaSlug)
        .eq("situacao", "ativo")
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar registros de ponto do funcionário no mês selecionado
  const { data: timeclockRecords = [] } = useQuery({
    queryKey: ["employee-timeclock", selectedEmployeeId, selectedDate],
    queryFn: async () => {
      if (!selectedEmployeeId || !selectedDate) return [];

      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      const { data, error } = await supabase
        .from("employee_timeclock")
        .select("*")
        .eq("employee_id", selectedEmployeeId)
        .gte("clock_in", startDate.toISOString())
        .lte("clock_in", endDate.toISOString())
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEmployeeId && !!selectedDate,
  });

  // Buscar registros do dia selecionado
  const dayRecords = timeclockRecords.filter((record) => {
    if (!selectedDate) return false;
    const recordDate = format(parseISO(record.clock_in), "yyyy-MM-dd");
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return recordDate === selectedDateStr;
  });

  // Mutation para atualizar registro de ponto
  const updateTimeclockMutation = useMutation({
    mutationFn: async ({ id, clock_in, clock_out }: { id: string; clock_in: string; clock_out: string | null }) => {
      const { error } = await supabase
        .from("employee_timeclock")
        .update({ clock_in, clock_out })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-timeclock"] });
      toast.success("Registro de ponto atualizado com sucesso!");
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar registro de ponto");
      console.error(error);
    },
  });

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setClockIn(format(parseISO(record.clock_in), "HH:mm"));
    setClockOut(record.clock_out ? format(parseISO(record.clock_out), "HH:mm") : "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRecord || !selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const newClockIn = `${dateStr}T${clockIn}:00`;
    const newClockOut = clockOut ? `${dateStr}T${clockOut}:00` : null;

    updateTimeclockMutation.mutate({
      id: editingRecord.id,
      clock_in: newClockIn,
      clock_out: newClockOut,
    });
  };

  const calculateWorkHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "Em andamento";
    
    const start = parseISO(clockIn);
    const end = parseISO(clockOut);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}min`;
  };

  const getTotalHoursForMonth = () => {
    let totalMs = 0;
    timeclockRecords.forEach((record) => {
      if (record.clock_out) {
        const start = parseISO(record.clock_in);
        const end = parseISO(record.clock_out);
        totalMs += end.getTime() - start.getTime();
      }
    });
    
    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${totalHours}h ${totalMinutes}min`;
  };

  const getDatesWithRecords = () => {
    return timeclockRecords.map((record) => new Date(record.clock_in));
  };

  const handleGeneratePDF = async () => {
    if (!selectedEmployeeId || !selectedDate) return;

    const employee = employees.find((e: any) => e.id === selectedEmployeeId);
    if (!employee) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      // Se solicitar dados completos, criar solicitação para admin
      if (requestFullData) {
        const reportData = {
          employee: {
            full_name: employee.full_name,
            cpf: employee.cpf,
            funcao: employee.funcao,
            matricula: employee.matricula,
            jornada: employee.jornada,
          },
          totalHours: getTotalHoursForMonth(),
        };

        const { error } = await supabase.from("report_requests").insert({
          employee_id: selectedEmployeeId,
          requested_by: user?.id,
          secretaria_slug: secretariaSlug,
          report_type: "ponto-eletronico",
          report_period: `${format(selectedDate, "MM", { locale: ptBR })}/${format(selectedDate, "yyyy", { locale: ptBR })}`,
          full_data_requested: true,
          status: "pending",
          report_data: reportData,
        });

        if (error) throw error;

        toast.success("Solicitação de relatório com dados completos enviada para aprovação!");
        setRequestFullData(false);
        return;
      }

      // Gerar relatório com dados mascarados
      await generateTimeclockPDF({
        employee: {
          full_name: employee.full_name,
          cpf: employee.cpf,
          funcao: employee.funcao,
          matricula: employee.matricula,
          jornada: employee.jornada,
        },
        month: format(selectedDate, "MM", { locale: ptBR }),
        year: format(selectedDate, "yyyy", { locale: ptBR }),
        records: timeclockRecords.map((record: any) => ({
          clock_in: record.clock_in,
          clock_out: record.clock_out,
          location: record.location,
          notes: record.notes,
        })),
        totalHours: getTotalHoursForMonth(),
        generatedBy: profile?.full_name || "Sistema",
        maskSensitiveData: true,
      });

      toast.success("Relatório PDF gerado com sucesso (dados sensíveis mascarados)!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ponto Eletrônico</h2>
        <p className="text-muted-foreground">
          Gerencie os registros de ponto dos funcionários da secretaria
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Funcionário</CardTitle>
          <CardDescription>Escolha um funcionário para visualizar seus registros de ponto</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um funcionário" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name} - {employee.funcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendário do Mês</CardTitle>
                <CardDescription>Clique em uma data para ver os registros</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="rounded-border pointer-events-auto"
                  modifiers={{
                    hasRecords: getDatesWithRecords(),
                  }}
                  modifiersStyles={{
                    hasRecords: {
                      fontWeight: "bold",
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
                <CardDescription>
                  {selectedDate && format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm text-muted-foreground">Funcionário</p>
                    <p className="text-lg font-semibold">{selectedEmployee.full_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm text-muted-foreground">Jornada</p>
                    <p className="text-lg font-semibold">{selectedEmployee.jornada || "Não definida"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Horas no Mês</p>
                    <p className="text-2xl font-bold text-primary">{getTotalHoursForMonth()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm text-muted-foreground">Dias com Registro</p>
                    <p className="text-lg font-semibold">{getDatesWithRecords().length} dias</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 rounded-lg border bg-card">
                  <Checkbox
                    id="request-full-data"
                    checked={requestFullData}
                    onCheckedChange={(checked) => setRequestFullData(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="request-full-data"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Solicitar Dados Completos
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requer aprovação do administrador
                    </p>
                  </div>
                </div>

                <Button onClick={handleGeneratePDF} className="w-full" variant="default">
                  <FileText className="mr-2 h-4 w-4" />
                  {requestFullData ? "Solicitar Relatório" : "Gerar Relatório PDF"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Registros do dia {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  {dayRecords.length > 0
                    ? `${dayRecords.length} registro(s) encontrado(s)`
                    : "Nenhum registro encontrado para esta data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dayRecords.length > 0 ? (
                  <div className="space-y-3">
                    {dayRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Entrada</p>
                              <p className="font-semibold">
                                {format(parseISO(record.clock_in), "HH:mm")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Saída</p>
                              <p className="font-semibold">
                                {record.clock_out
                                  ? format(parseISO(record.clock_out), "HH:mm")
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="font-semibold">
                                {calculateWorkHours(record.clock_in, record.clock_out)}
                              </p>
                            </div>
                          </div>
                          {record.location && (
                            <p className="text-xs text-muted-foreground">Local: {record.location}</p>
                          )}
                          {record.notes && (
                            <p className="text-xs text-muted-foreground">Obs: {record.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum registro de ponto para esta data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro de Ponto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clock_in">Horário de Entrada</Label>
              <Input
                id="clock_in"
                type="time"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clock_out">Horário de Saída</Label>
              <Input
                id="clock_out"
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateTimeclockMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
