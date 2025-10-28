import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import { toast } from "sonner";
import { Loader2, Upload, User } from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const ProfessorProfile = () => {
  const queryClient = useQueryClient();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["professor-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professor-profile"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      telefone: formData.get("telefone"),
      cpf: formData.get("cpf"),
      birth_date: formData.get("birth_date") || null,
      endereco_completo: formData.get("endereco_completo"),
    };

    updateProfileMutation.mutate(data);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande! O tamanho máximo é 20 MB.");
      e.target.value = "";
      return;
    }

    // Validar tipo do arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      e.target.value = "";
      return;
    }

    // Criar URL temporária para preview e crop
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setCropDialogOpen(true);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;

    setIsUploadingAvatar(true);
    setCropDialogOpen(false);

    try {
      // Gerar nome único para o arquivo
      const fileName = `${user.id}-${Date.now()}.webp`;
      const filePath = fileName;

      // Upload do arquivo WebP para o bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar URL temporária para preview instantâneo
      setTempAvatarUrl(publicUrl + `?t=${Date.now()}`);

      // Atualizar perfil no banco de dados
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ["professor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto");
      setTempAvatarUrl(null);
    } finally {
      setIsUploadingAvatar(false);
      // Limpar URL temporária da imagem selecionada
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
        setSelectedImageUrl("");
      }
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl("");
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "PR";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
          <CardDescription>
            Atualize suas informações pessoais e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={tempAvatarUrl || profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {isUploadingAvatar ? "Enviando..." : "Alterar Foto"}
                  </span>
                </div>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
                disabled={isUploadingAvatar}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou GIF. Máximo 20MB. Será convertido para WebP.
              </p>
            </div>
          </div>

          {/* Crop Dialog */}
          <ImageCropDialog
            open={cropDialogOpen}
            imageUrl={selectedImageUrl}
            onClose={handleCropCancel}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
          />

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name || ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile?.email || user?.email || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  defaultValue={profile?.cpf || ""}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  defaultValue={profile?.telefone || ""}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={profile?.birth_date || ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco_completo">Endereço Completo</Label>
                <Input
                  id="endereco_completo"
                  name="endereco_completo"
                  defaultValue={profile?.endereco_completo || ""}
                  placeholder="Rua, número, bairro, cidade, estado"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
