/**
 * CityAppShell
 * 
 * App shell for city-specific subdomains (e.g., afogados.urbanbyte.com.br)
 * Renders the full Conecta application with city-specific theme and data
 * 
 * Access: All users within the city's domain
 */

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MapPin } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DomainGuard } from "@/guards/DomainGuard";
import { useCityBySubdomain } from "@/hooks/useCityBySubdomain";
import { useDynamicPWA } from "@/hooks/useDynamicPWA";

// Page imports (same as App.tsx)
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Saude from "@/pages/Saude";
import AssistenciaSocial from "@/pages/AssistenciaSocial";
import Educacao from "@/pages/Educacao";
import Financas from "@/pages/Financas";
import Cultura from "@/pages/Cultura";
import Obras from "@/pages/Obras";
import Iptu from "@/pages/Iptu";
import AgendarConsulta from "@/pages/AgendarConsulta";
import IluminacaoPublica from "@/pages/IluminacaoPublica";
import Ouvidoria from "@/pages/Ouvidoria";
import Notificacoes from "@/pages/Notificacoes";
import Esporte from "@/pages/Esporte";
import Agricultura from "@/pages/Agricultura";
import Mulher from "@/pages/Mulher";
import Noticias from "@/pages/Noticias";
import NoticiaDetalhes from "@/pages/NoticiaDetalhes";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import PainelPrefeito from "@/pages/PainelPrefeito";
import PainelSecretario from "@/pages/PainelSecretario";
import PainelEducacao from "@/pages/PainelEducacao";
import StudentDetail from "@/pages/StudentDetail";
import PainelProfessor from "@/pages/PainelProfessor";
import PainelAluno from "@/pages/PainelAluno";
import PainelPais from "@/pages/PainelPais";
import SecretariaDetalhes from "@/pages/SecretariaDetalhes";
import SecretariasList from "@/pages/SecretariasList";
import FacialTest from "@/pages/FacialTest";
import ExpoAgro from "@/pages/ExpoAgro";
import Download from "@/pages/Download";
import CompanyDashboard from "@/pages/CompanyDashboard";
import { ProtectedMasterRoute } from "@/components/ProtectedMasterRoute";

const queryClient = new QueryClient();

/**
 * AnimatedRoutes Component
 * Contains all Conecta application routes (extracted from App.tsx lines 47-114)
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  useDynamicPWA();
  
  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/perfil" element={<Profile />} />
        
        {/* Dynamic Secretarias Routes */}
        <Route path="/servicos" element={<SecretariasList />} />
        <Route path="/secretarias/:slug" element={<SecretariaDetalhes />} />
        <Route path="/expo-agro" element={<ExpoAgro />} />
        
        {/* Secretarias Routes */}
        <Route path="/saude" element={<Saude />} />
        <Route path="/assistencia" element={<AssistenciaSocial />} />
        <Route path="/financas" element={<Financas />} />
        <Route path="/cultura" element={<Cultura />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/esporte" element={<Esporte />} />
        <Route path="/agricultura" element={<Agricultura />} />
        <Route path="/mulher" element={<Mulher />} />
        
        {/* Página pública de Educação */}
        <Route path="/educacao" element={<Educacao />} />
        <Route path="/secretarias/educacao" element={<Navigate to="/educacao" replace />} />
        
        {/* Specific Services */}
        <Route path="/iptu" element={<Iptu />} />
        <Route path="/agendar-consulta" element={<AgendarConsulta />} />
        <Route path="/iluminacao-publica" element={<IluminacaoPublica />} />
        <Route path="/ouvidoria" element={<Ouvidoria />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/noticia/:id" element={<NoticiaDetalhes />} />
        <Route path="/download" element={<Download />} />
        <Route path="/agenda" element={<Navigate to="/" replace />} />
        
        {/* Admin & Panels */}
        <Route path="/admin" element={<Admin />} />
        <Route 
          path="/admin/urbanbyte" 
          element={
            <ProtectedMasterRoute>
              <CompanyDashboard />
            </ProtectedMasterRoute>
          } 
        />
        <Route path="/painel-prefeito" element={<PainelPrefeito />} />
        <Route path="/painel-secretario" element={<PainelSecretario />} />
        <Route path="/ascom" element={<PainelSecretario />} />
        <Route path="/edu" element={<PainelEducacao />} />
        <Route path="/edu/aluno/:studentId" element={<StudentDetail />} />
        <Route path="/aluno/:studentId" element={<StudentDetail />} />
        <Route path="/edu/professor" element={<PainelProfessor />} />
        <Route path="/painel-professor" element={<Navigate to="/edu/professor" replace />} />
        <Route path="/painel-aluno" element={<PainelAluno />} />
        <Route path="/painel-pais" element={<PainelPais />} />
        <Route path="/facial-test" element={<FacialTest />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

/**
 * Loading Component
 * Displayed while city data is being fetched
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Carregando cidade...</h2>
        <p className="text-sm text-muted-foreground">Aguarde enquanto buscamos as informações</p>
      </div>
    </div>
  </div>
);

/**
 * CityNotFound Component
 * Displayed when city cannot be found or is inactive
 */
const CityNotFound = ({ subdomain }: { subdomain: string }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle>Cidade Não Encontrada</CardTitle>
        </div>
        <CardDescription>
          Não foi possível encontrar a cidade para este endereço
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Subdomínio solicitado:</p>
            <p className="text-sm text-muted-foreground font-mono">{subdomain}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Possíveis causas:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>A cidade não está cadastrada no sistema</li>
            <li>A cidade está temporariamente desativada</li>
            <li>O endereço pode estar incorreto</li>
          </ul>
        </div>
        <div className="pt-2">
          <p className="text-sm text-muted-foreground">
            Entre em contato com o suporte se o problema persistir.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Inner component that uses hooks requiring QueryClient
 * This must be wrapped by QueryClientProvider
 */
function CityAppContent({ subdomain }: { subdomain: string }) {
  // Fetch city data by subdomain
  const { data: city, isLoading, error } = useCityBySubdomain(subdomain);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state or city not found
  if (error || !city) {
    return <CityNotFound subdomain={subdomain} />;
  }

  // Success - render app with city theme and routes
  return (
    <ThemeProvider citySlug={city.slug}>
      <TooltipProvider>
        <DomainGuard>
          <AnimatedRoutes />
        </DomainGuard>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </ThemeProvider>
  );
}

/**
 * CityAppShell Component
 * 
 * Main app shell for city-specific subdomains.
 * Fetches city data, applies theme, and renders all Conecta routes.
 * 
 * @param subdomain - City subdomain (e.g., "afogados-da-ingazeira")
 * 
 * @example
 * ```tsx
 * <CityAppShell subdomain="afogados-da-ingazeira" />
 * ```
 */
export function CityAppShell({ subdomain }: { subdomain: string }) {
  // Note: BrowserRouter is provided by main.tsx (single router for entire app)
  return (
    <QueryClientProvider client={queryClient}>
      <CityAppContent subdomain={subdomain} />
    </QueryClientProvider>
  );
}
