/**
 * RootShell
 * 
 * App shell for urbanbyte.com.br (root domain)
 * Marketing/institutional website
 * 
 * Access: Public (no authentication required)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Rocket, Users, Zap } from 'lucide-react';
import { getDashboardUrl } from '@/guards/domain-access';
import { DomainType } from '@/core/domain-types';

const queryClient = new QueryClient();

/**
 * Root App Shell (Placeholder)
 * 
 * This is a placeholder for the future marketing/institutional website.
 * Will include: product information, case studies, blog, contact forms, etc.
 */
export function RootShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted">
          {/* Hero Section */}
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="flex justify-center mb-6">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                UrbanByte
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Plataforma white-label de portal do cidadão para municípios brasileiros
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-8">
                <Button size="lg" className="gap-2">
                  <Rocket className="h-5 w-5" />
                  Conhecer Soluções
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = getDashboardUrl(DomainType.MASTER)}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Área do Cliente
                </Button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Multi-tenant</CardTitle>
                  <CardDescription>
                    Cada cidade com seu próprio portal, tema e módulos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Building2 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>White Label</CardTitle>
                  <CardDescription>
                    Totalmente personalizável com identidade visual da cidade
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Rocket className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Módulos Flexíveis</CardTitle>
                  <CardDescription>
                    Educação, Saúde, Transparência e muito mais
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Este é um placeholder para o site institucional da UrbanByte.
                  <br />
                  Em breve: cases de sucesso, blog, contato e área de parceiros.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
