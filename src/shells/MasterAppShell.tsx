/**
 * MasterAppShell
 * 
 * App shell for dash.urbanbyte.com.br
 * UrbanByte Control Center - Platform administration dashboard
 * 
 * Access: Only MASTER role users
 */

import { Route, Switch } from 'wouter';
import { DomainGuard } from '@/guards/DomainGuard';
import CompanyDashboard from '@/pages/CompanyDashboard';
import AuthMaster from '@/pages/auth/AuthMaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

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
        <DomainGuard>
          <Switch>
            <Route path="/auth" component={AuthMaster} />
            <Route path="/dashboard" component={CompanyDashboard} />
            <Route path="/" component={CompanyDashboard} />
          </Switch>
        </DomainGuard>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
