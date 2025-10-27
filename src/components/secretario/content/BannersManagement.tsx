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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { bannerSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link: string | null;
  display_type: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  secretaria_slug: string | null;
}

export function BannersManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link: "",
    display_type: "popup",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    is_active: true,
    secretaria_slug: "comunicacao",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subscrever atualizações em tempo real
  useRealtimeSubscription("campaign_banners", "secretario-banners");

  const { data: banners } = useQuery({
    queryKey: ["secretario-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_banners")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as Banner[];
    },
  });

  const createBanner = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Converter strings vazias em null para campos opcionais
      const cleanData = {
        ...data,
        link: data.link?.trim() || null,
        end_date: data.end_date?.trim() || null,
        description: data.description?.trim() || null,
        created_by: user?.id,
      };
      
      const { error } = await supabase.from("campaign_banners").insert([cleanData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-banners"] });
      toast({ title: "Banner criado com sucesso!" });
      resetForm();
    },
    onError: (error) => {
      console.error("Erro ao criar banner:", error);
      toast({ title: "Erro ao criar banner", variant: "destructive" });
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // Converter strings vazias em null para campos opcionais
      const cleanData = {
        ...data,
        link: data.link?.trim() || null,
        end_date: data.end_date?.trim() || null,
        description: data.description?.trim() || null,
      };
      
      const { error } = await supabase.from("campaign_banners").update(cleanData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-banners"] });
      toast({ title: "Banner atualizado com sucesso!" });
      resetForm();
    },
    onError: (error) => {
      console.error("Erro ao atualizar banner:", error);
      toast({ title: "Erro ao atualizar banner", variant: "destructive" });
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaign_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretario-banners"] });
      toast({ title: "Banner deletado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar banner", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      link: "",
      display_type: "popup",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      is_active: true,
      secretaria_slug: "comunicacao",
    });
    setEditingBanner(null);
    setDialogOpen(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || "",
      image_url: banner.image_url,
      link: banner.link || "",
      display_type: banner.display_type,
      start_date: banner.start_date.split('T')[0],
      end_date: banner.end_date?.split('T')[0] || "",
      is_active: banner.is_active,
      secretaria_slug: banner.secretaria_slug || "comunicacao",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    // Validar com zod
    try {
      bannerSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (editingBanner) {
      updateBanner.mutate({ id: editingBanner.id, data: formData });
    } else {
      createBanner.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Banners de Campanha</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Editar" : "Criar"} Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título do banner"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
              <FileUpload
                bucket="app-assets"
                path="banners"
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                currentUrl={formData.image_url}
              />
              <Input
                placeholder="Link de destino (opcional)"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
              <Select
                value={formData.display_type}
                onValueChange={(value) => setFormData({ ...formData, display_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de exibição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popup">Popup</SelectItem>
                  <SelectItem value="banner">Banner na página</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Banner ativo</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingBanner ? "Atualizar" : "Criar"}
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
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners?.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell className="capitalize">{banner.display_type}</TableCell>
                <TableCell>
                  {format(new Date(banner.start_date), "dd/MM/yyyy")}
                  {banner.end_date && ` - ${format(new Date(banner.end_date), "dd/MM/yyyy")}`}
                </TableCell>
                <TableCell>
                  <span className={banner.is_active ? "text-green-600" : "text-gray-600"}>
                    {banner.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBanner.mutate(banner.id)}
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
