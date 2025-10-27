import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { eventSchema, type EventFormData } from "@/lib/validationSchemas";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time: string | null;
}

export function EventsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Subscrever atualizações em tempo real
  useRealtimeSubscription("events", "admin-events");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
  });

  const { data: events } = useQuery({
    queryKey: ["events-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (data: EventFormData) => {
      const { error } = await supabase.from("events").insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      toast({ title: "Sucesso!", description: "Evento criado com sucesso." });
      resetForm();
      setDialogOpen(false);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventFormData> }) => {
      const { error } = await supabase.from("events").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      toast({ title: "Sucesso!", description: "Evento atualizado com sucesso." });
      resetForm();
      setDialogOpen(false);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      toast({ title: "Sucesso!", description: "Evento removido com sucesso." });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      event_date: "",
      event_time: "",
    });
    setEditingEvent(null);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      event_time: event.event_time || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    // Validar dados antes de submeter
    const validation = eventSchema.safeParse(formData);
    
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(", ");
      toast({ 
        title: "Erro de validação", 
        description: errors,
        variant: "destructive" 
      });
      return;
    }

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: validation.data });
    } else {
      createEvent.mutate(validation.data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Eventos</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar Evento" : "Novo Evento"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do evento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título do evento"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do evento"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Local do evento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingEvent ? "Atualizar" : "Criar"} Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>
                  {new Date(event.event_date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>{event.event_time || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEvent.mutate(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
