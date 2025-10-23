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

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration: number | null;
  category: string | null;
  status: string;
  secretaria_slug: string | null;
  published_at: string;
}

export function PodcastManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    audio_url: "",
    cover_image_url: "",
    duration: "",
    category: "geral",
    status: "published" as "published" | "draft",
    secretaria_slug: "comunicacao",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: podcasts } = useQuery({
    queryKey: ["secretario-podcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Podcast[];
    },
  });

  const createPodcast = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("podcasts").insert([{
        ...data,
        duration: data.duration ? parseInt(data.duration) : null,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-podcasts"] });
      toast({ title: "Podcast criado com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar podcast", variant: "destructive" });
    },
  });

  const updatePodcast = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("podcasts").update({
        ...data,
        duration: data.duration ? parseInt(data.duration) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-podcasts"] });
      toast({ title: "Podcast atualizado com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar podcast", variant: "destructive" });
    },
  });

  const deletePodcast = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("podcasts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-podcasts"] });
      toast({ title: "Podcast deletado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar podcast", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      audio_url: "",
      cover_image_url: "",
      duration: "",
      category: "geral",
      status: "published",
      secretaria_slug: "comunicacao",
    });
    setEditingPodcast(null);
    setDialogOpen(false);
  };

  const handleEdit = (podcast: Podcast) => {
    setEditingPodcast(podcast);
    setFormData({
      title: podcast.title,
      description: podcast.description || "",
      audio_url: podcast.audio_url,
      cover_image_url: podcast.cover_image_url || "",
      duration: podcast.duration?.toString() || "",
      category: podcast.category || "geral",
      status: podcast.status as "published" | "draft",
      secretaria_slug: podcast.secretaria_slug || "comunicacao",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.audio_url) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e arquivo de áudio são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (editingPodcast) {
      updatePodcast.mutate({ id: editingPodcast.id, data: formData });
    } else {
      createPodcast.mutate(formData);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Podcasts</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Podcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPodcast ? "Editar" : "Criar"} Podcast</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título do podcast"
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
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="politica">Política</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="cultura">Cultura</SelectItem>
                  <SelectItem value="entrevista">Entrevista</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Descrição do podcast"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Áudio do Podcast</label>
                <Input
                  placeholder="URL do arquivo de áudio"
                  value={formData.audio_url}
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole a URL do arquivo de áudio hospedado
                </p>
              </div>
              <Input
                type="number"
                placeholder="Duração em segundos (opcional)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Capa do Podcast</label>
                <FileUpload
                  bucket="app-assets"
                  path="podcasts"
                  onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                  currentUrl={formData.cover_image_url}
                />
              </div>
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
                  {editingPodcast ? "Atualizar" : "Criar"}
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
              <TableHead>Duração</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {podcasts?.map((podcast) => (
              <TableRow key={podcast.id}>
                <TableCell className="font-medium">{podcast.title}</TableCell>
                <TableCell className="capitalize">{podcast.category}</TableCell>
                <TableCell>{formatDuration(podcast.duration)}</TableCell>
                <TableCell>{format(new Date(podcast.published_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <span className={podcast.status === "published" ? "text-green-600" : "text-yellow-600"}>
                    {podcast.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(podcast)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePodcast.mutate(podcast.id)}
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
