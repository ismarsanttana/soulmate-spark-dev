import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@supabase/supabase-js";

const Ouvidoria = () => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    manifestationType: "",
    category: "",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Pre-fill form with user data if available
        supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setFormData((prev) => ({
                ...prev,
                fullName: data.full_name || "",
                email: data.email || "",
              }));
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user's protocols
  const { data: protocols, isLoading } = useQuery({
    queryKey: ["ombudsman-protocols", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ombudsman_protocols")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Create new protocol mutation
  const createProtocolMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Generate protocol number
      const protocolNumber = `${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 999999)
      ).padStart(6, "0")}`;

      const { error } = await supabase.from("ombudsman_protocols").insert({
        protocol_number: protocolNumber,
        manifestation_type: data.manifestationType as any,
        category: data.category,
        full_name: data.fullName,
        email: data.email || null,
        description: data.description,
        user_id: user?.id || null,
        status: "aberto",
      });

      if (error) throw error;
      return protocolNumber;
    },
    onSuccess: (protocolNumber) => {
      toast({
        title: "Manifestação registrada com sucesso!",
        description: `Protocolo: ${protocolNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["ombudsman-protocols"] });
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        manifestationType: "",
        category: "",
        description: "",
      });
      // Re-fetch user data for next submission
      if (user) {
        supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setFormData((prev) => ({
                ...prev,
                fullName: data.full_name || "",
                email: data.email || "",
              }));
            }
          });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar manifestação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.manifestationType || !formData.category || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createProtocolMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
      case "em_andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
      case "encerrado":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto":
        return "Aberto";
      case "em_andamento":
        return "Em andamento";
      case "encerrado":
        return "Encerrado";
      default:
        return status;
    }
  };

  const getManifestationTypeLabel = (type: string) => {
    switch (type) {
      case "reclamacao":
        return "Reclamação";
      case "elogio":
        return "Elogio";
      case "sugestao":
        return "Sugestão";
      case "solicitacao":
        return "Solicitação";
      default:
        return type;
    }
  };

  return (
    <Layout>
      <Header pageTitle="Ouvidoria Municipal" />

      {/* Assistente Virtual */}
      <div className="mb-5 bg-card rounded-2xl p-4 shadow-sm card-hover">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary text-white h-10 w-10 rounded-xl flex items-center justify-center">
            <i className="fas fa-robot text-lg"></i>
          </div>
          <div>
            <p className="font-semibold text-sm">Assistente Virtual</p>
            <p className="text-xs text-muted-foreground">
              Tire suas dúvidas sobre a Ouvidoria
            </p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-3 text-sm mb-3">
          <p>
            <strong>👋 Olá, cidadão!</strong>
            <br />
            Registre reclamações, elogios, sugestões ou solicitações. Você pode acompanhar o status do seu protocolo a qualquer momento.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Digite sua pergunta..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            className="absolute right-2 top-1.5 text-primary"
            aria-label="Enviar"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-lg">Ouvidoria Municipal</h2>
        <p className="text-xs text-muted-foreground">
          Registre manifestações e acompanhe seus protocolos.
        </p>
      </div>

      {/* Nova Manifestação */}
      <div className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <h3 className="font-semibold mb-1">Nova manifestação</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Preencha o formulário abaixo para registrar sua manifestação.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nome completo *</Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <Label htmlFor="manifestationType">Tipo de manifestação *</Label>
            <Select
              value={formData.manifestationType}
              onValueChange={(value) =>
                setFormData({ ...formData, manifestationType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reclamacao">Reclamação</SelectItem>
                <SelectItem value="elogio">Elogio</SelectItem>
                <SelectItem value="sugestao">Sugestão</SelectItem>
                <SelectItem value="solicitacao">Solicitação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
                <SelectItem value="obras">Obras e Infraestrutura</SelectItem>
                <SelectItem value="iluminacao">Iluminação Pública</SelectItem>
                <SelectItem value="limpeza">Limpeza Urbana</SelectItem>
                <SelectItem value="transporte">Transporte</SelectItem>
                <SelectItem value="assistencia">Assistência Social</SelectItem>
                <SelectItem value="financas">Finanças</SelectItem>
                <SelectItem value="cultura">Cultura e Turismo</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva sua manifestação"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createProtocolMutation.isPending}
          >
            {createProtocolMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Enviando...
              </>
            ) : (
              "Enviar manifestação"
            )}
          </Button>
        </form>
      </div>

      {/* Acompanhar Protocolos */}
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold">Meus protocolos</h3>
          <p className="text-xs text-muted-foreground">
            {user
              ? "Acompanhe o andamento das suas manifestações."
              : "Faça login para acompanhar seus protocolos."}
          </p>
        </div>

        {!user ? (
          <div className="text-center py-8 text-muted-foreground">
            <i className="fas fa-user-lock text-4xl mb-3"></i>
            <p className="text-sm">Faça login para ver seus protocolos</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <i className="fas fa-spinner fa-spin text-2xl"></i>
            <p className="text-sm mt-2">Carregando protocolos...</p>
          </div>
        ) : protocols && protocols.length > 0 ? (
          <div className="space-y-3">
            {protocols.map((protocol) => (
              <article
                key={protocol.id}
                className="rounded-xl border border-border bg-muted/30 p-3 space-y-2"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">
                      PROTOCOLO {protocol.protocol_number}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {getManifestationTypeLabel(protocol.manifestation_type)} •{" "}
                      {protocol.category} • Aberto em{" "}
                      {new Date(protocol.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(
                      protocol.status
                    )}`}
                  >
                    {getStatusLabel(protocol.status)}
                  </span>
                </header>
                <p className="text-xs">{protocol.description}</p>
                {protocol.response && (
                  <div className="bg-primary/5 rounded-lg p-2 mt-2">
                    <p className="text-xs font-semibold text-primary mb-1">
                      Resposta da Prefeitura:
                    </p>
                    <p className="text-xs">{protocol.response}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <i className="fas fa-inbox text-4xl mb-3"></i>
            <p className="text-sm">Você ainda não possui protocolos</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Ouvidoria;
