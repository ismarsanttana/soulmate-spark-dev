import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/admin/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface AgendaEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  category: string | null;
  image_url: string | null;
  status: string;
  secretaria_slug: string | null;
}

export function AgendaManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    end_date: "",
    location: "",
    category: "evento",
    image_url: "",
    status: "published" as "published" | "draft",
    secretaria_slug: "comunicacao",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ["secretario-agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("city_agenda")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as AgendaEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("city_agenda").insert([{
        ...data,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-agenda"] });
      toast({ title: "Evento criado com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar evento", variant: "destructive" });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("city_agenda").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-agenda"] });
      toast({ title: "Evento atualizado com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar evento", variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("city_agenda").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-agenda"] });
      toast({ title: "Evento deletado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar evento", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      end_date: "",
      location: "",
      category: "evento",
      image_url: "",
      status: "published",
      secretaria_slug: "comunicacao",
    });
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const handleEdit = (event: AgendaEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date.split('T')[0],
      end_date: event.end_date?.split('T')[0] || "",
      location: event.location || "",
      category: event.category || "evento",
      image_url: event.image_url || "",
      status: event.status as "published" | "draft",
      secretaria_slug: event.secretaria_slug || "comunicacao",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.event_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e data do evento são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: formData });
    } else {
      createEvent.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agenda da Cidade</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Editar" : "Criar"} Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título do evento"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="audiencia">Audiência Pública</SelectItem>
                  <SelectItem value="feira">Feira</SelectItem>
                  <SelectItem value="cultura">Cultura</SelectItem>
                  <SelectItem value="esporte">Esporte</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Fim (opcional)</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Input
                placeholder="Local do evento"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Textarea
                placeholder="Descrição do evento"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
              <FileUpload
                bucket="app-assets"
                path="agenda"
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                currentUrl={formData.image_url}
              />
              <Select
                value={formData.status}
                onValueChange={(value: "published" | "draft") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingEvent ? "Atualizar" : "Criar"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell className="capitalize">{event.category}</TableCell>
                <TableCell>{format(new Date(event.event_date), "dd/MM/yyyy")}</TableCell>
                <TableCell>{event.location || "-"}</TableCell>
                <TableCell>
                  <span className={event.status === "published" ? "text-green-600" : "text-yellow-600"}>
                    {event.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
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
