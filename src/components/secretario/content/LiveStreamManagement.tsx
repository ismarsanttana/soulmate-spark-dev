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
import { Pencil, Trash2, Plus, Radio } from "lucide-react";
import { format } from "date-fns";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  stream_url: string;
  thumbnail_url: string | null;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  status: string;
  secretaria_slug: string | null;
}

export function LiveStreamManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stream_url: "",
    thumbnail_url: "",
    scheduled_at: "",
    status: "scheduled",
    secretaria_slug: "comunicacao",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: streams } = useQuery({
    queryKey: ["secretario-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      return data as LiveStream[];
    },
  });

  const createStream = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("live_streams").insert([{
        ...data,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-streams"] });
      toast({ title: "Transmissão criada com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar transmissão", variant: "destructive" });
    },
  });

  const updateStream = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("live_streams").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-streams"] });
      toast({ title: "Transmissão atualizada com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar transmissão", variant: "destructive" });
    },
  });

  const deleteStream = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_streams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-streams"] });
      toast({ title: "Transmissão deletada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar transmissão", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      stream_url: "",
      thumbnail_url: "",
      scheduled_at: "",
      status: "scheduled",
      secretaria_slug: "comunicacao",
    });
    setEditingStream(null);
    setDialogOpen(false);
  };

  const handleEdit = (stream: LiveStream) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      description: stream.description || "",
      stream_url: stream.stream_url,
      thumbnail_url: stream.thumbnail_url || "",
      scheduled_at: stream.scheduled_at.slice(0, 16),
      status: stream.status,
      secretaria_slug: stream.secretaria_slug || "comunicacao",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.stream_url || !formData.scheduled_at) {
      toast({
        title: "Campos obrigatórios",
        description: "Título, URL da transmissão e data são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (editingStream) {
      updateStream.mutate({ id: editingStream.id, data: formData });
    } else {
      createStream.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transmissão ao Vivo</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transmissão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStream ? "Editar" : "Criar"} Transmissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título da transmissão"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição da transmissão"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              <Input
                placeholder="URL da transmissão (YouTube, etc)"
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Data e Hora Agendada</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
              <FileUpload
                bucket="app-assets"
                path="streams"
                onUploadComplete={(url) => setFormData({ ...formData, thumbnail_url: url })}
                currentUrl={formData.thumbnail_url}
              />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="live">Ao Vivo</SelectItem>
                  <SelectItem value="ended">Finalizada</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingStream ? "Atualizar" : "Criar"}
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
              <TableHead>Data Agendada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {streams?.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {stream.status === "live" && <Radio className="h-4 w-4 text-red-500 animate-pulse" />}
                    {stream.title}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(stream.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                </TableCell>
                <TableCell>
                  <span className={
                    stream.status === "live" ? "text-red-600 font-semibold" :
                    stream.status === "scheduled" ? "text-blue-600" :
                    "text-gray-600"
                  }>
                    {stream.status === "live" ? "Ao Vivo" :
                     stream.status === "scheduled" ? "Agendada" :
                     "Finalizada"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(stream)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteStream.mutate(stream.id)}
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
