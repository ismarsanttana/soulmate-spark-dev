import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Phone, FileText, Camera, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
}

export function SecretarioProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [initialFormState, setInitialFormState] = useState<FormState | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userSecretariat } = useQuery({
    queryKey: ["user-secretariat-profile"],
    queryFn: async () => {
      if (!user) return null;
      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (assignment?.secretaria_slug) {
        const { data: secretaria } = await supabase
          .from("secretarias")
          .select("name")
          .eq("slug", assignment.secretaria_slug)
          .single();
        return secretaria?.name || "Secretaria";
      }
      return "Secretaria";
    },
    enabled: !!user,
  });

  // Carregar dados do perfil do usuário
  // IMPORTANTE: A tabela 'profiles' é a fonte única da verdade para dados pessoais
  // Todos os dados salvos em qualquer parte do sistema devem ser salvos aqui
  useEffect(() => {
    if (!user || !profile) return;

    console.log("📋 Carregando dados do perfil no painel do secretário:", {
      full_name: profile.full_name,
      email: profile.email,
      telefone: profile.telefone,
      cpf: profile.cpf,
      avatar_url: profile.avatar_url
    });

    const nextFormState: FormState = {
      fullName: profile.full_name || "",
      email: profile.email || user.email || "",
      phone: profile.telefone || "",
      cpf: profile.cpf || "",
    };

    setFormState(nextFormState);
    setInitialFormState(nextFormState);
    setAvatarUrl(profile.avatar_url || null);
  }, [profile, user]);

  const handleAvatarSelect = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("Faça login para atualizar sua foto.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("A imagem deve ter no máximo 3MB.");
      event.target.value = "";
      return;
    }

    // Create preview URL for crop dialog
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageForCrop(imageUrl);
    setCropDialogOpen(true);
    
    // Clear file input
    event.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    
    setCropDialogOpen(false);
    setAvatarUploading(true);

    try {
      const fileExt = "png";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          upsert: true,
          cacheControl: "3600",
          contentType: "image/png",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setAvatarUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-secretario"] });
      toast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error("Não foi possível atualizar a foto do perfil.");
    } finally {
      setAvatarUploading(false);
      if (selectedImageForCrop) {
        URL.revokeObjectURL(selectedImageForCrop);
        setSelectedImageForCrop(null);
      }
    }
  };

  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop(null);
    }
  };

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = event.target;

    if (field === "cpf") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      if (digits.length <= 3) {
        value = digits;
      } else if (digits.length <= 6) {
        value = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      } else if (digits.length <= 9) {
        value = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      } else {
        value = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      }
    }

    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: formState.fullName,
          email: formState.email || null,
          telefone: formState.phone || null,
          cpf: formState.cpf || null,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;

      setInitialFormState(formState);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-secretario"] });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    if (initialFormState) {
      setFormState(initialFormState);
    }
  };

  const hasChanges = initialFormState && JSON.stringify(formState) !== JSON.stringify(initialFormState);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações de Perfil</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize seus dados pessoais e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-border">
                <AvatarImage src={avatarUrl || ""} alt={formState.fullName} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {formState.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarSelect}
                  disabled={avatarUploading}
                  className="gap-2"
                >
                  {avatarUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Alterar Foto
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WEBP. Máximo 3MB.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  value={formState.fullName}
                  onChange={handleInputChange("fullName")}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange("email")}
                  placeholder="seu.email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={formState.phone}
                  onChange={handleInputChange("phone")}
                  placeholder="(87) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">
                  <FileText className="h-4 w-4 inline mr-2" />
                  CPF
                </Label>
                <Input
                  id="cpf"
                  value={formState.cpf}
                  onChange={handleInputChange("cpf")}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {/* Role Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Cargo:</span>
                <span className="text-muted-foreground">{userSecretariat || "Carregando..."}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!hasChanges || savingProfile}
              >
                {savingProfile ? "Salvando..." : "Salvar Alterações"}
              </Button>
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={savingProfile}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Segurança:</strong> A redefinição de senha só pode ser realizada pelo Administrador do sistema 
          para garantir a segurança da sua conta. Entre em contato com o suporte caso precise redefinir sua senha.
        </AlertDescription>
      </Alert>

      {selectedImageForCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          imageUrl={selectedImageForCrop}
          onClose={handleCropDialogClose}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
