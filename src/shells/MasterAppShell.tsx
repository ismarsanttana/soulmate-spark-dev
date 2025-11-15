/**
 * MasterAppShell
 * 
 * App shell for dash.urbanbyte.com.br
 * UrbanByte Control Center - Platform administration dashboard
 * 
 * Access: Only MASTER role users
 */

import { Routes, Route } from "react-router-dom";
import { DomainGuard } from "@/guards/DomainGuard";
import CompanyDashboard from "@/pages/CompanyDashboard";
import { MasterLoginPage } from "@/pages/master/MasterLoginPage";
import { ProtectedMasterRoute } from "@/components/ProtectedMasterRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

/**
 * Master App Shell
 * 
 * Renders the UrbanByte Control Center with authentication routes
 */
export function MasterAppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Routes>
          <Route path="/auth" element={<MasterLoginPage />} />
          <Route
            path="/*"
            element={
              <DomainGuard>
                <ProtectedMasterRoute>
                  <CompanyDashboard />
                </ProtectedMasterRoute>
              </DomainGuard>
            }
          />
        </Routes>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
