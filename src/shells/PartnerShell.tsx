/**
 * PartnerShell
 * 
 * App shell for parceiro.urbanbyte.com.br
 * Partner/reseller panel for managing their city portfolio
 * 
 * Access: PARTNER role users (and optionally MASTER)
 */

import { Route, Switch } from 'wouter';
import { DomainGuard } from '@/guards/DomainGuard';
import AuthPartner from '@/pages/auth/AuthPartner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Handshake, TrendingUp } from 'lucide-react';

const queryClient = new QueryClient();

/**
 * Placeholder Dashboard Component
 */
function PartnerDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Handshake className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Painel do Parceiro</CardTitle>
          </div>
          <CardDescription>
            Portal de parceiros e revendedores UrbanByte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Construction className="h-6 w-6 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Em Desenvolvimento</p>
              <p className="text-sm text-muted-foreground">
                Esta área está sendo construída e estará disponível em breve.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funcionalidades Planejadas
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Visão geral do portfólio de cidades</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Métricas de desempenho e engajamento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Dashboard financeiro e comissionamento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Ferramentas de prospecção e vendas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Materiais de marketing e apresentação</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Você está acessando parceiro.urbanbyte.com.br como parceiro credenciado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Partner App Shell
 * 
 * Routes for the Partner Panel
 */
export function PartnerShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DomainGuard>
          <Switch>
            <Route path="/auth" component={AuthPartner} />
            <Route path="/dashboard" component={PartnerDashboard} />
            <Route path="/" component={PartnerDashboard} />
          </Switch>
        </DomainGuard>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
