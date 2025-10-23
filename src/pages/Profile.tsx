import { Layout } from "@/components/Layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProtocolRow = Database["public"]["Tables"]["ombudsman_protocols"]["Row"];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  cpf: string;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const protocolStatusBadge: Record<
  Database["public"]["Enums"]["protocol_status"],
  { label: string; badgeClass: string; cardClass: string }
> = {
  aberto: {
    label: "Em anÃ¡lise",
    badgeClass:
      "px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    cardClass: "bg-gray-50 dark:bg-gray-900",
  },
  em_andamento: {
    label: "Em andamento",
    badgeClass:
      "px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
    cardClass: "bg-white dark:bg-gray-900",
  },
  encerrado: {
    label: "ConcluÃ­do",
    badgeClass:
      "px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    cardClass: "bg-white dark:bg-gray-900",
  },
};

const formatDate = (input?: string | null) => {
  if (!input) return "";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR");
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "U";
};

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    cpf: "",
  });
  const [initialFormState, setInitialFormState] = useState<FormState | null>(
    null
  );
  const [securityForm, setSecurityForm] = useState<SecurityForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loadingUser, navigate, user]);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<
    ProfileRow | null
  >({
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
    retry: 1,
  });

  useEffect(() => {
    if (profileError) {
      console.error(profileError);
      toast.error("Não foi possível carregar os dados do perfil.");
    }
  }, [profileError]);

  const { data: protocols = [], isLoading: protocolsLoading, error: protocolsError } = useQuery<
    ProtocolRow[]
  >({
    queryKey: ["protocols", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ombudsman_protocols")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    if (protocolsError) {
      console.error(protocolsError);
      toast.error("Não foi possível carregar seus protocolos.");
    }
  }, [protocolsError]);

  useEffect(() => {
    if (!user) return;

    const derivedFullName =
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "";

    const derivedAvatarUrl =
      profile?.avatar_url ||
      (user.user_metadata?.avatar_url as string | undefined) ||
      null;

    const nextFormState: FormState = {
      fullName: derivedFullName,
      email:
        profile?.email ||
        (user.user_metadata?.contact_email as string | undefined) ||
        user.email ||
        "",
      phone: (user.user_metadata?.phone as string | undefined) || "",
      address: (user.user_metadata?.address as string | undefined) || "",
      cpf: profile?.cpf || (user.user_metadata?.cpf as string | undefined) || "",
    };

    setFormState(nextFormState);
    setInitialFormState(nextFormState);
    setAvatarUrl(derivedAvatarUrl);
    setInitialAvatarUrl(derivedAvatarUrl);
  }, [profile, user]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAssistantOpen(false);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);

  const greetingName = useMemo(() => {
    if (!formState.fullName) return "OlÃ¡!";
    const firstName = formState.fullName.split(" ")[0] || "";
    return `OlÃ¡, ${firstName}!`;
  }, [formState.fullName]);

  const memberSinceLabel = useMemo(() => {
    const source =
      profile?.created_at || user?.created_at || user?.last_sign_in_at;
    if (!source) return null;
    const year = new Date(source).getFullYear();
    if (!year || Number.isNaN(year)) return null;
    return `Municipe desde ${year}`;
  }, [profile?.created_at, user?.created_at, user?.last_sign_in_at]);

  const cpfSuffix = useMemo(() => {
    const digits = formState.cpf.replace(/\D/g, "");
    if (!digits) return "000-00";
    const suffix = digits.slice(-5).padStart(5, "0");
    return `${suffix.slice(0, 3)}-${suffix.slice(3)}`;
  }, [formState.cpf]);

  const inProgressProtocols = useMemo(() => {
    return protocols.filter(
      (protocol) => protocol.status === "aberto" || protocol.status === "em_andamento"
    ).length;
  }, [protocols]);

  const closedProtocols = useMemo(() => {
    return protocols.filter((protocol) => protocol.status === "encerrado").length;
  }, [protocols]);

  const protocolSuggestions = useMemo(() => {
    if (!protocols.length) {
      return [
        "Como atualizar meu endereÃ§o?",
        "Quero falar sobre um protocolo encerrado",
        "Quais documentos preciso para um novo protocolo?",
      ];
    }

    return protocols.map((protocol) => `Status do protocolo ${protocol.protocol_number}`);
  }, [protocols]);

  const handleAvatarSelect = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) {
      toast.error("Faca login para atualizar sua foto.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem valido.");
      event.target.value = "";
      return;
    }

    const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("A imagem deve ter no maximo 3MB.");
      event.target.value = "";
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
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

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (metadataError) throw metadataError;

      setAvatarUrl(publicUrl);
      setInitialAvatarUrl(publicUrl);
      toast.success("Foto atualizada com sucesso.");
    } catch (error: unknown) {
      console.error(error);
      toast.error("NÃ£o foi possÃ­vel atualizar a foto do perfil.");
    } finally {
      setAvatarUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleInputChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setFormState((previous) => ({ ...previous, [field]: value }));
    };

  const handleSecurityInputChange =
    (field: keyof SecurityForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSecurityForm((previous) => ({ ...previous, [field]: value }));
    };

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: formState.fullName,
          email: formState.email || null,
          cpf: formState.cpf || null,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: formState.fullName,
          phone: formState.phone || null,
          address: formState.address || null,
          cpf: formState.cpf || null,
          avatar_url: avatarUrl,
        },
      });

      if (metadataError) throw metadataError;

      setInitialFormState(formState);
      setInitialAvatarUrl(avatarUrl);
      toast.success("Dados pessoais atualizados com sucesso.");
    } catch (error: unknown) {
      console.error(error);
      toast.error("NÃ£o foi possÃ­vel salvar as alteraÃ§Ãµes.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    if (initialFormState) {
      setFormState(initialFormState);
    }
    setAvatarUrl(initialAvatarUrl);
  };

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user) return;

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error("As senhas nÃ£o coincidem.");
      return;
    }

    if (securityForm.newPassword.length < 6) {
      toast.error("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }

    setUpdatingPassword(true);
    try {
      if (!user.email) {
        toast.error("NÃ£o foi possÃ­vel validar o usuÃ¡rio.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: securityForm.currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: securityForm.newPassword,
      });

      if (updateError) {
        toast.error(updateError.message || "Erro ao atualizar a senha.");
        return;
      }

      toast.success("Senha atualizada com sucesso.");
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      console.error(error);
      toast.error("NÃ£o foi possÃ­vel atualizar a senha.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAssistantToggle = () => {
    setAssistantOpen((previous) => !previous);
  };

  const handleAssistantSubmit = () => {
    if (!assistantMessage.trim()) {
      toast.error("Digite uma mensagem para enviar.");
      return;
    }

    toast.info("Assistente virtual ainda em desenvolvimento.");
    setAssistantMessage("");
  };

  const cardLoading = profileLoading || protocolsLoading || loadingUser;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-primary to-blue-700 text-white rounded-2xl p-5 shadow-lg mb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${formState.fullName || "Perfil do cidadao"}`}
                  className="h-12 w-12 rounded-xl object-cover border border-white/40 bg-white/10"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {getInitials(formState.fullName)}
                  </span>
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center text-xs font-semibold">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">Perfil do cidadao</p>
              <h1 className="text-xl font-bold">{greetingName}</h1>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white/20">
                  CPF final {cpfSuffix}
                </span>
                {memberSinceLabel && (
                  <span className="px-3 py-1 rounded-full bg-white/20">
                    {memberSinceLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="bg-white/15 p-2 rounded-xl hover:bg-white/20 transition"
            aria-label="Voltar para inÃ­cio"
          >
            <i className="fas fa-arrow-left text-white"></i>
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/15 rounded-xl p-3">
            <span className="block opacity-75">SolicitaÃ§Ãµes em andamento</span>
            <strong className="text-lg">
              {String(inProgressProtocols).padStart(2, "0")}
            </strong>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <span className="block opacity-75">Protocolos concluÃ­dos</span>
            <strong className="text-lg">
              {String(closedProtocols).padStart(2, "0")}
            </strong>
          </div>
        </div>
      </div>

      <main>
        <section className="bg-card dark:bg-card rounded-2xl p-5 shadow-sm mb-5 card-hover border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Dados pessoais</h2>
              <p className="text-xs text-muted-foreground">
                Mantenha suas informaÃ§Ãµes sempre atualizadas.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
              <i className="fas fa-circle text-[6px]"></i>{" "}
              {profile?.updated_at
                ? `Atualizado em ${formatDate(profile.updated_at)}`
                : "Primeiro acesso"}
            </span>
          </div>
          <form className="space-y-3 text-sm" onSubmit={handleProfileSubmit}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto do cidadao"
                    className="h-16 w-16 rounded-2xl object-cover border border-border bg-muted/40"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-muted/60 dark:bg-muted/20 flex items-center justify-center text-lg font-semibold text-muted-foreground">
                    {getInitials(formState.fullName)}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center text-white text-xs">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
                )}
              </div>
              <div className="text-xs space-y-2">
                <button
                  type="button"
                  onClick={handleAvatarSelect}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 font-semibold transition disabled:opacity-70"
                  disabled={avatarUploading}
                >
                  <i className="fas fa-camera"></i>
                  {avatarUploading ? "Enviando..." : "Atualizar foto"}
                </button>
                <p className="text-muted-foreground">
                  JPG ou PNG com at&eacute; 3MB. A foto aparece no seu painel.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Nome completo
              </label>
              <input
                type="text"
                value={formState.fullName}
                onChange={handleInputChange("fullName")}
                className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Seu nome"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange("email")}
                  className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={handleInputChange("phone")}
                  className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  CPF
                </label>
                <input
                  type="text"
                  value={formState.cpf}
                  onChange={handleInputChange("cpf")}
                  className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                EndereÃ§o
              </label>
              <input
                type="text"
                value={formState.address}
                onChange={handleInputChange("address")}
                className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Rua, nÃºmero, bairro"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savingProfile ? "Salvando..." : "Salvar alteraÃ§Ãµes"}
              </button>
              <button
                type="button"
                onClick={handleCancelProfile}
                className="px-4 py-3 rounded-xl border border-border text-muted-foreground transition hover:border-primary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>

        <section className="bg-card dark:bg-card rounded-2xl p-5 shadow-sm mb-5 card-hover border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">SeguranÃ§a da conta</h2>
              <p className="text-xs text-muted-foreground">
                Altere sua senha e revise os acessos recentes.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <i className="fas fa-shield-alt"></i> AutenticaÃ§Ã£o ativa
            </span>
          </div>
          <form className="space-y-3 text-sm" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Senha atual
              </label>
              <input
                type="password"
                value={securityForm.currentPassword}
                onChange={handleSecurityInputChange("currentPassword")}
                className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="********"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={handleSecurityInputChange("newPassword")}
                  className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="********"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={handleSecurityInputChange("confirmPassword")}
                  className="w-full rounded-xl border border-border px-4 py-3 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="********"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {updatingPassword ? "Atualizando..." : "Atualizar senha"}
            </button>
          </form>
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3">Atividades recentes</h3>
            <ul className="text-xs space-y-2 text-muted-foreground">
              {cardLoading && (
                <li className="animate-pulse h-4 bg-muted rounded"></li>
              )}
              {!cardLoading && protocols.length === 0 && (
                <li className="flex items-center gap-2">
                  <i className="fas fa-info-circle text-primary"></i>
                  Nenhuma atividade registrada atÃ© o momento.
                </li>
              )}
              {!cardLoading &&
                protocols.map((protocol) => (
                  <li key={protocol.id} className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-emerald-500"></i>
                    {`Protocolo ${protocol.protocol_number} atualizado em ${formatDate(
                      protocol.updated_at
                    )}`}
                  </li>
                ))}
            </ul>
          </div>
        </section>

        <section className="bg-card dark:bg-card rounded-2xl p-5 shadow-sm card-hover mb-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Status das solicitaÃ§Ãµes</h2>
              <p className="text-xs text-muted-foreground">
                Acompanhe o andamento dos seus protocolos.
              </p>
            </div>
            <Link
              to="/ouvidoria#acompanhar"
              className="text-xs text-primary font-semibold"
            >
              Ver histÃ³rico completo
            </Link>
          </div>
          <div className="space-y-4">
            {cardLoading && (
              <>
                <div className="h-28 rounded-2xl bg-muted animate-pulse"></div>
                <div className="h-28 rounded-2xl bg-muted animate-pulse"></div>
              </>
            )}

            {!cardLoading && protocols.length === 0 && (
              <div className="p-4 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                VocÃª ainda nÃ£o possui protocolos. Inicie uma solicitaÃ§Ã£o na
                Ã¡rea de Ouvidoria.
              </div>
            )}

            {!cardLoading &&
              protocols.map((protocol) => {
                const statusDetails = protocolStatusBadge[protocol.status];
                return (
                  <article
                    key={protocol.id}
                    className={`p-4 rounded-2xl border border-border ${statusDetails.cardClass}`}
                  >
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-semibold text-muted-foreground">
                        {protocol.protocol_number.toUpperCase()}
                      </span>
                      <span className={statusDetails.badgeClass}>
                        {statusDetails.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {protocol.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aberto em {formatDate(protocol.created_at)} â€¢{" "}
                      {protocol.manifestation_type.replace("_", " ")}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <i className="fas fa-comments"></i>
                      {protocol.response
                        ? `Ãšltima atualizaÃ§Ã£o em ${formatDate(
                            protocol.updated_at
                          )}`
                        : "Aguardando retorno da equipe."}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </main>

      <div className="fixed inset-y-0 right-4 z-30 flex flex-col items-end justify-center gap-3 pointer-events-none">
        <div
          className={`pointer-events-auto w-72 max-w-full rounded-2xl bg-card dark:bg-card shadow-2xl border border-border transition transform ${
            assistantOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 hidden"
          }`}
        >
          <div className="flex items-start justify-between p-4 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Assistente Virtual
              </p>
              <h2 className="text-sm font-semibold">Como posso ajudar?</h2>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Fechar assistente"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="p-4 space-y-3 text-xs text-muted-foreground">
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="font-semibold text-primary mb-1">
                SugestÃµes rÃ¡pidas
              </p>
              <ul className="space-y-1">
                {protocolSuggestions.map((suggestion) => (
                  <li key={suggestion}>â€¢ {suggestion}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                Pergunte algo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={assistantMessage}
                  onChange={(event) => setAssistantMessage(event.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 rounded-xl border border-border px-3 py-2 bg-muted/40 dark:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
                <button
                  type="button"
                  onClick={handleAssistantSubmit}
                  className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          id="assistant-toggle"
          type="button"
          aria-expanded={assistantOpen}
          onClick={handleAssistantToggle}
          className="pointer-events-auto h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl flex items-center justify-center text-xl transition"
        >
          <i className="fas fa-comments"></i>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
    </Layout>
  );
};

export default Profile;





