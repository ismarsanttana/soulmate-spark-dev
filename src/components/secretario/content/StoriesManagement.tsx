import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/admin/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface Story {
  id: string;
  title: string;
  media_url: string;
  media_type: string;
  duration: number;
  link: string | null;
  expires_at: string;
  created_at: string;
}

export function StoriesManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    media_url: "",
    media_type: "image" as "image" | "video",
    duration: 5,
    link: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stories } = useQuery({
    queryKey: ["secretario-stories"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.user.id)
        .single();

      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("secretaria_slug", assignment?.secretaria_slug)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Story[];
    },
  });

  const createStory = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.user?.id)
        .single();

      const { error } = await supabase.from("stories").insert([{
        ...data,
        secretaria_slug: assignment?.secretaria_slug,
        created_by: user.user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-stories"] });
      toast({ title: "Story criado com sucesso!" });
      resetForm();
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-stories"] });
      toast({ title: "Story deletado com sucesso!" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", media_url: "", media_type: "image", duration: 5, link: "" });
    setEditingStory(null);
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.media_url) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    createStory.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Stories</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Story
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título do story"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Select
                value={formData.media_type}
                onValueChange={(value: "image" | "video") => 
                  setFormData({ ...formData, media_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Duração (segundos)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
              <Input
                placeholder="Link (opcional)"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
              <FileUpload
                bucket="app-assets"
                path="stories"
                onUploadComplete={(url) => setFormData({ ...formData, media_url: url })}
                currentUrl={formData.media_url}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">Criar</Button>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
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
              <TableHead>Tipo</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories?.map((story) => (
              <TableRow key={story.id}>
                <TableCell>{story.title}</TableCell>
                <TableCell>{story.media_type === "image" ? "Imagem" : "Vídeo"}</TableCell>
                <TableCell>{format(new Date(story.expires_at), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStory.mutate(story.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
