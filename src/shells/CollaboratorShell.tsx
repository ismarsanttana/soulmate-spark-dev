/**
 * CollaboratorShell
 * 
 * App shell for colaborador.urbanbyte.com.br
 * Internal team panel for support, onboarding, and technical assistance
 * 
 * Access: TEAM role users (and optionally MASTER)
 */

import { Route, Switch } from 'wouter';
import { DomainGuard } from '@/guards/DomainGuard';
import AuthCollaborator from '@/pages/auth/AuthCollaborator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, HeadphonesIcon, Users } from 'lucide-react';

const queryClient = new QueryClient();

/**
 * Placeholder Dashboard Component
 */
function CollaboratorDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <HeadphonesIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Painel do Colaborador</CardTitle>
          </div>
          <CardDescription>
            Portal interno da equipe UrbanByte
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
              <Users className="h-5 w-5" />
              Funcionalidades Planejadas
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Sistema de tickets de suporte para cidades</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Acompanhamento de implantações e onboarding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Ferramentas de diagnóstico e troubleshooting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Base de conhecimento e documentação técnica</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Métricas de atendimento e SLA</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Você está acessando colaborador.urbanbyte.com.br como membro da equipe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Collaborator App Shell
 * 
 * Routes for the Collaborator Panel
 */
export function CollaboratorShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DomainGuard>
          <Switch>
            <Route path="/auth" component={AuthCollaborator} />
            <Route path="/dashboard" component={CollaboratorDashboard} />
            <Route path="/" component={CollaboratorDashboard} />
          </Switch>
        </DomainGuard>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
