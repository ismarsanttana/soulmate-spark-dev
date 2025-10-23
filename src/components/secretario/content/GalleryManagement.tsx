import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/admin/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string | null;
  secretaria_slug: string | null;
  created_at: string;
}

export function GalleryManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    category: "geral",
    secretaria_slug: "comunicacao",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gallery } = useQuery({
    queryKey: ["secretario-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  const createImage = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("gallery").insert([{
        ...data,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-gallery"] });
      toast({ title: "Imagem adicionada com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar imagem", variant: "destructive" });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-gallery"] });
      toast({ title: "Imagem deletada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar imagem", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      category: "geral",
      secretaria_slug: "comunicacao",
    });
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.image_url) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e imagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createImage.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Galeria de Imagens</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Imagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Imagem à Galeria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título da imagem"
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
                  <SelectItem value="eventos">Eventos</SelectItem>
                  <SelectItem value="obras">Obras</SelectItem>
                  <SelectItem value="cultura">Cultura</SelectItem>
                  <SelectItem value="esporte">Esporte</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              <FileUpload
                bucket="app-assets"
                path="galeria"
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                currentUrl={formData.image_url}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  Adicionar
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery?.map((item) => (
            <div key={item.id} className="relative group">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-3">
                <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                <p className="text-white/80 text-xs mb-2 line-clamp-2">{item.description}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteImage.mutate(item.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              </div>
            </div>
          ))}
        </div>
        {!gallery || gallery.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma imagem na galeria. Adicione a primeira!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
