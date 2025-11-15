/**
 * MasterAppShell
 * 
 * App shell for dash.urbanbyte.com.br
 * UrbanByte Control Center - Platform administration dashboard
 * 
 * Access: Only MASTER role users
 */

import { DomainGuard } from '@/guards/DomainGuard';
import CompanyDashboard from '@/pages/CompanyDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

/**
 * Master App Shell
 * 
 * Renders the UrbanByte Control Center (Company Dashboard)
 * Protected by DomainGuard to ensure only MASTER users can access
 */
export function MasterAppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DomainGuard>
          <CompanyDashboard />
        </DomainGuard>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
