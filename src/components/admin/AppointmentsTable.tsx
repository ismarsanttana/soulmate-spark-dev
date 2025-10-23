import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User } from "lucide-react";

interface Appointment {
  id: string;
  full_name: string;
  phone: string;
  specialty: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface AppointmentsTableProps {
  appointments: Appointment[];
  queryKey: string[];
}

export function AppointmentsTable({ appointments, queryKey }: AppointmentsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pendente");

  const updateAppointment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("appointments")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Sucesso!",
        description: "Consulta atualizada com sucesso.",
      });
      setSelectedAppointment(null);
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar consulta.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.notes || "");
    setStatus(appointment.status);
  };

  const handleSave = () => {
    if (!selectedAppointment) return;

    updateAppointment.mutate({
      id: selectedAppointment.id,
      data: {
        notes,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pendente: { variant: "default", label: "Pendente" },
      confirmado: { variant: "secondary", label: "Confirmado" },
      concluido: { variant: "outline", label: "Concluído" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Especialidade</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{appointment.full_name}</p>
                  <p className="text-sm text-muted-foreground">{appointment.phone}</p>
                </div>
              </TableCell>
              <TableCell>{appointment.specialty}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {new Date(appointment.preferred_date).toLocaleDateString("pt-BR")}
                  <Clock className="h-3 w-3 ml-2" />
                  {appointment.preferred_time}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(appointment.status)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(appointment)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Gerenciar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consulta de {selectedAppointment?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Telefone</Label>
                <p>{selectedAppointment?.phone}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Especialidade</Label>
                <p>{selectedAppointment?.specialty}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Data Preferida</Label>
                <p>{selectedAppointment && new Date(selectedAppointment.preferred_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Horário Preferido</Label>
                <p>{selectedAppointment?.preferred_time}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a consulta..."
                rows={4}
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={updateAppointment.isPending}>
              {updateAppointment.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
