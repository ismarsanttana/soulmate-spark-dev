import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para subscrever atualizações em tempo real do Supabase
 * Invalida automaticamente as queries do React Query quando houver mudanças
 */
export function useRealtimeSubscription(
  table: string,
  queryKey: string | string[],
  options?: {
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
    filter?: string;
  }
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        "postgres_changes" as any,
        {
          event: options?.event || "*",
          schema: "public",
          table: table,
          filter: options?.filter,
        } as any,
        (payload) => {
          console.log(`[Realtime] Mudança detectada em ${table}:`, payload);
          
          // Invalida a query para forçar re-fetch dos dados
          const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
          queryClient.invalidateQueries({ queryKey: keys });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Inscrito em ${table}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Realtime] Erro ao se inscrever em ${table}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`[Realtime] Desinscrito de ${table}`);
    };
  }, [table, queryKey, queryClient, options?.event, options?.filter]);
}

/**
 * Hook para subscrever múltiplas tabelas de uma vez
 */
export function useRealtimeSubscriptions(
  subscriptions: Array<{
    table: string;
    queryKey: string | string[];
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
    filter?: string;
  }>
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = subscriptions.map(({ table, queryKey, event, filter }) => {
      const channel = supabase
        .channel(`realtime-${table}-${Date.now()}`)
        .on(
          "postgres_changes" as any,
          {
            event: event || "*",
            schema: "public",
            table: table,
            filter: filter,
          } as any,
          (payload) => {
            console.log(`[Realtime] Mudança detectada em ${table}:`, payload);
            
            const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
            queryClient.invalidateQueries({ queryKey: keys });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`[Realtime] Inscrito em ${table}`);
          } else if (status === "CHANNEL_ERROR") {
            console.error(`[Realtime] Erro ao se inscrever em ${table}`);
          }
        });

      return channel;
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      console.log(`[Realtime] Desinscrito de ${subscriptions.length} tabelas`);
    };
  }, [subscriptions, queryClient]);
}
