import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SocialMediaAccount {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
  auto_publish: boolean;
}

export interface PublishToSocialParams {
  contentType: string;
  contentId: string;
  platforms: string[];
  customTexts?: Record<string, string>;
  scheduleAt?: Date;
}

export function useSocialMedia(secretariaSlug?: string) {
  const queryClient = useQueryClient();

  // Buscar contas conectadas
  const { data: connectedAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["social-accounts", secretariaSlug],
    queryFn: async () => {
      if (!secretariaSlug) return [];
      const { data, error } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("secretaria_slug", secretariaSlug)
        .eq("is_active", true);
      if (error) throw error;
      return data as SocialMediaAccount[];
    },
    enabled: !!secretariaSlug,
  });

  // Buscar histórico de publicações
  const usePublishHistory = (limit = 20) => {
    return useQuery({
      queryKey: ["social-posts-history", secretariaSlug, limit],
      queryFn: async () => {
        if (!secretariaSlug || !connectedAccounts) return [];
        const accountIds = connectedAccounts.map((a) => a.id);
        const { data, error } = await supabase
          .from("social_media_posts")
          .select("*")
          .in("account_id", accountIds)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        return data;
      },
      enabled: !!secretariaSlug && !!connectedAccounts,
    });
  };

  // Publicar nas redes sociais
  const publishMutation = useMutation({
    mutationFn: async (params: PublishToSocialParams) => {
      if (!connectedAccounts) throw new Error("Nenhuma conta conectada");

      const selectedAccounts = connectedAccounts.filter((acc) =>
        params.platforms.includes(acc.platform)
      );

      if (selectedAccounts.length === 0) {
        throw new Error("Nenhuma conta ativa para as plataformas selecionadas");
      }

      // Criar registros de posts para cada plataforma
      const posts = selectedAccounts.map((account) => ({
        content_type: params.contentType,
        content_id: params.contentId,
        platform: account.platform,
        account_id: account.id,
        status: params.scheduleAt ? "scheduled" : "pending",
        scheduled_at: params.scheduleAt?.toISOString(),
        custom_text: params.customTexts?.[account.platform] || null,
      }));

      const { data, error } = await supabase
        .from("social_media_posts")
        .insert(posts)
        .select();

      if (error) throw error;

      // Chamar edge function para publicar (se não for agendado)
      if (!params.scheduleAt && data) {
        try {
          const { error: publishError } = await supabase.functions.invoke(
            "social-publish",
            {
              body: {
                postIds: data.map((p) => p.id),
              },
            }
          );
          if (publishError) throw publishError;
        } catch (err) {
          console.error("Erro ao chamar edge function:", err);
        }
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["social-posts-history"] });
      if (variables.scheduleAt) {
        toast.success("Publicação agendada com sucesso!");
      } else {
        toast.success(
          `Publicando em ${variables.platforms.length} rede(s) social(is)...`
        );
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao publicar: ${error.message}`);
    },
  });

  // Verificar se pode publicar automaticamente
  const canAutoPublish = (platform: string) => {
    const account = connectedAccounts?.find((a) => a.platform === platform);
    return account?.auto_publish ?? false;
  };

  // Obter contas com auto-publish ativado
  const getAutoPublishAccounts = () => {
    return connectedAccounts?.filter((a) => a.auto_publish) ?? [];
  };

  return {
    connectedAccounts,
    accountsLoading,
    publishToSocial: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
    usePublishHistory,
    canAutoPublish,
    getAutoPublishAccounts,
  };
}