import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SecretarioSidebar } from "./SecretarioSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SecretarioLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SecretarioLayout({ children, activeTab, onTabChange }: SecretarioLayoutProps) {
  const { data: secretariaName } = useQuery({
    queryKey: ["secretary-assignment-layout"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "Secretaria de Comunicação";

      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("secretaria_slug")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!assignment) return "Secretaria de Comunicação";

      const { data: secretaria } = await supabase
        .from("secretarias")
        .select("name")
        .eq("slug", assignment.secretaria_slug)
        .single();

      return secretaria?.name || "Secretaria de Comunicação";
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SecretarioSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Painel da {secretariaName || "Secretaria de Comunicação"}</h1>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
