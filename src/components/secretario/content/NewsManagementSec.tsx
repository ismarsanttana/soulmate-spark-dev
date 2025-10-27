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
import { newsSchema } from "@/lib/validationSchemas";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  image_url: string | null;
  published_at: string;
}

export function NewsManagementSec() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [createStory, setCreateStory] = useState(false);
  
  // Subscrever atualizações em tempo real
  useRealtimeSubscription("news", "secretary-news");
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "geral",
    image_url: "",
  });
  const [storyData, setStoryData] = useState({
    story_title: "",
    story_image: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: news } = useQuery({
    queryKey: ["secretario-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as News[];
    },
  });

  const createNews = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newsData, error } = await supabase.from("news").insert([{
        ...data,
        status: "published",
      }]).select().single();
      
      if (error) throw error;

      // Se marcou para criar story, cria automaticamente
      if (createStory && newsData) {
        const { error: storyError } = await supabase.from("stories").insert([{
          title: storyData.story_title || data.title,
          media_url: storyData.story_image || data.image_url,
          media_type: "image",
          link: `/noticia/${newsData.id}`,
          duration: 5,
          status: "published",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }]);
        
        if (storyError) throw storyError;
      }
      
      return newsData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-news"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast({ 
        title: createStory ? "Notícia e story criados com sucesso!" : "Notícia criada com sucesso!" 
      });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar notícia", variant: "destructive" });
    },
  });

  const updateNews = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("news").update({
        ...data,
        status: "published",
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-news"] });
      toast({ title: "Notícia atualizada com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar notícia", variant: "destructive" });
    },
  });

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-news"] });
      toast({ title: "Notícia deletada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar notícia", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", summary: "", content: "", category: "geral", image_url: "" });
    setStoryData({ story_title: "", story_image: "" });
    setCreateStory(false);
    setEditingNews(null);
    setDialogOpen(false);
  };

  const handleEdit = (news: News) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content,
      category: news.category,
      image_url: news.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    try {
      newsSchema.parse(formData);
      if (editingNews) {
        updateNews.mutate({ id: editingNews.id, data: formData });
      } else {
        createNews.mutate(formData);
      }
    } catch (error: any) {
      toast({
        title: "Erro de validação",
        description: error.errors?.[0]?.message || "Verifique os campos",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Notícias</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Notícia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNews ? "Editar" : "Criar"} Notícia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Resumo (breve descrição)"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
              <Textarea
                placeholder="Conteúdo completo"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
              <FileUpload
                bucket="news-images"
                path="noticias"
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                currentUrl={formData.image_url}
              />
              
              {!editingNews && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-story"
                      checked={createStory}
                      onCheckedChange={(checked) => setCreateStory(checked as boolean)}
                    />
                    <Label htmlFor="create-story" className="cursor-pointer">
                      Criar story desta notícia automaticamente
                    </Label>
                  </div>
                  
                  {createStory && (
                    <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                      <p className="text-sm text-muted-foreground">
                        Personalize o story ou use os dados da notícia
                      </p>
                      <Input
                        placeholder="Título do story (opcional - usa título da notícia)"
                        value={storyData.story_title}
                        onChange={(e) => setStoryData({ ...storyData, story_title: e.target.value })}
                      />
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Imagem do story (opcional - usa imagem da notícia)
                        </Label>
                        <FileUpload
                          bucket="news-images"
                          path="stories"
                          onUploadComplete={(url) => setStoryData({ ...storyData, story_image: url })}
                          currentUrl={storyData.story_image}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ✨ O story será criado com link automático para esta notícia e expira em 24h
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingNews ? "Atualizar" : "Criar"}
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
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{format(new Date(item.published_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNews.mutate(item.id)}
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
