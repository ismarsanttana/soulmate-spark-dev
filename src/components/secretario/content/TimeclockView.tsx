import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar } from "lucide-react";

interface TimeclockViewProps {
  secretariaSlug: string;
  employees: any[];
}

export function TimeclockView({ secretariaSlug, employees }: TimeclockViewProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();

  const { data: timeclockRecords, isLoading } = useQuery({
    queryKey: ["employee-timeclock", selectedEmployee, selectedMonth],
    queryFn: async () => {
      if (!selectedEmployee) return [];

      const startDate = new Date(selectedMonth + "-01");
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("employee_timeclock")
        .select("*")
        .eq("employee_id", selectedEmployee)
        .gte("clock_in", startDate.toISOString())
        .lte("clock_in", endDate.toISOString())
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployee,
  });

  const updateTimeclockMutation = useMutation({
    mutationFn: async ({ id, clockOut }: { id: string; clockOut: string }) => {
      const { error } = await supabase
        .from("employee_timeclock")
        .update({ clock_out: clockOut })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-timeclock"] });
      toast.success("Ponto ajustado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao ajustar ponto");
    },
  });

  const calculateWorkHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "Em andamento";
    
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getTotalHours = () => {
    if (!timeclockRecords) return "0h 0m";
    
    let totalMinutes = 0;
    timeclockRecords.forEach((record) => {
      if (record.clock_out) {
        const start = new Date(record.clock_in);
        const end = new Date(record.clock_out);
        totalMinutes += differenceInMinutes(end, start);
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employee">Funcionário</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger id="employee">
              <SelectValue placeholder="Selecione um funcionário" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name} - {employee.matricula}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="month">Mês</Label>
          <Input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {selectedEmployee && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Funcionário</CardDescription>
                <CardTitle className="text-lg">{selectedEmployeeData?.full_name}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Jornada</CardDescription>
                <CardTitle className="text-lg">{selectedEmployeeData?.jornada || "Não definida"}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Horas (mês)</CardDescription>
                <CardTitle className="text-lg">{getTotalHours()}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando registros de ponto...
            </div>
          ) : timeclockRecords?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de ponto encontrado para este período
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeclockRecords?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.clock_in), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.clock_in), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        {record.clock_out ? (
                          format(new Date(record.clock_out), "HH:mm")
                        ) : (
                          <Badge variant="secondary">Em andamento</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {calculateWorkHours(record.clock_in, record.clock_out)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.location || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
