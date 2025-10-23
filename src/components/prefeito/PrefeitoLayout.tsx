import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PrefeitoSidebar } from "./PrefeitoSidebar";

interface PrefeitoLayoutProps {
  children: ReactNode;
}

export function PrefeitoLayout({ children }: PrefeitoLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PrefeitoSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Painel do Prefeito</h1>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
