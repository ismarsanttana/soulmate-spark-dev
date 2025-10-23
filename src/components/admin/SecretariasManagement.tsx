import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Secretaria {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  business_hours: string | null;
  is_active: boolean;
}

export function SecretariasManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSecretaria, setEditingSecretaria] = useState<Secretaria | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "Building2",
    color: "#1EAEDB",
    phone: "",
    email: "",
    address: "",
    business_hours: "",
    is_active: true,
  });

  const { data: secretarias, isLoading } = useQuery({
    queryKey: ["secretarias-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretarias")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Secretaria[];
    },
  });

  const createSecretaria = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("secretarias").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretarias-admin"] });
      toast({ title: "Sucesso!", description: "Secretaria criada com sucesso." });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar secretaria.", variant: "destructive" });
    },
  });

  const updateSecretaria = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("secretarias").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretarias-admin"] });
      toast({ title: "Sucesso!", description: "Secretaria atualizada com sucesso." });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar secretaria.", variant: "destructive" });
    },
  });

  const deleteSecretaria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("secretarias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretarias-admin"] });
      toast({ title: "Sucesso!", description: "Secretaria removida com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao remover secretaria.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "Building2",
      color: "#1EAEDB",
      phone: "",
      email: "",
      address: "",
      business_hours: "",
      is_active: true,
    });
    setEditingSecretaria(null);
  };

  const handleEdit = (secretaria: Secretaria) => {
    setEditingSecretaria(secretaria);
    setFormData({
      name: secretaria.name,
      slug: secretaria.slug,
      description: secretaria.description || "",
      icon: secretaria.icon,
      color: secretaria.color,
      phone: secretaria.phone || "",
      email: secretaria.email || "",
      address: secretaria.address || "",
      business_hours: secretaria.business_hours || "",
      is_active: secretaria.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSecretaria) {
      updateSecretaria.mutate({ id: editingSecretaria.id, data: formData });
    } else {
      createSecretaria.mutate(formData);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Secretarias</h2>
          <p className="text-muted-foreground">Gerencie todas as secretarias do município</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Secretaria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSecretaria ? "Editar Secretaria" : "Nova Secretaria"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da secretaria
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Secretaria de Saúde"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="saude"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da secretaria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone (Lucide)</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Building2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(87) 3838-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="secretaria@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua Exemplo, 123"
                />
              </div>

              <div className="space-y-2">
                <Label>Horário de Funcionamento</Label>
                <Input
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  placeholder="Segunda a Sexta, 8h às 17h"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Secretaria Ativa</Label>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingSecretaria ? "Atualizar" : "Criar"} Secretaria
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {secretarias?.map((secretaria) => (
          <Card key={secretaria.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: secretaria.color }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{secretaria.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">/{secretaria.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(secretaria)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSecretaria.mutate(secretaria.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2">
                {secretaria.description || "Sem descrição"}
              </CardDescription>
              <div className="mt-4 space-y-1 text-sm">
                {secretaria.phone && <p>📞 {secretaria.phone}</p>}
                {secretaria.email && <p>✉️ {secretaria.email}</p>}
              </div>
              <div className="mt-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    secretaria.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                >
                  {secretaria.is_active ? "Ativa" : "Inativa"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
