import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Saude from "./pages/Saude";
import AssistenciaSocial from "./pages/AssistenciaSocial";
import Educacao from "./pages/Educacao";
import Financas from "./pages/Financas";
import Cultura from "./pages/Cultura";
import Obras from "./pages/Obras";
import Iptu from "./pages/Iptu";
import AgendarConsulta from "./pages/AgendarConsulta";
import IluminacaoPublica from "./pages/IluminacaoPublica";
import Ouvidoria from "./pages/Ouvidoria";
import Notificacoes from "./pages/Notificacoes";
import Esporte from "./pages/Esporte";
import Noticias from "./pages/Noticias";
import NoticiaDetalhes from "./pages/NoticiaDetalhes";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import PainelPrefeito from "./pages/PainelPrefeito";
import PainelSecretario from "./pages/PainelSecretario";
import SecretariaDetalhes from "./pages/SecretariaDetalhes";
import SecretariasList from "./pages/SecretariasList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/perfil" element={<Profile />} />
          
          {/* Dynamic Secretarias Routes */}
          <Route path="/servicos" element={<SecretariasList />} />
          <Route path="/secretarias/:slug" element={<SecretariaDetalhes />} />
          
          {/* Redirects for backwards compatibility */}
          <Route path="/saude" element={<Navigate to="/secretarias/saude" replace />} />
          <Route path="/educacao" element={<Navigate to="/secretarias/educacao" replace />} />
          <Route path="/assistencia" element={<Navigate to="/secretarias/assistencia" replace />} />
          <Route path="/financas" element={<Navigate to="/secretarias/financas" replace />} />
          <Route path="/cultura" element={<Navigate to="/secretarias/cultura" replace />} />
          <Route path="/obras" element={<Navigate to="/secretarias/obras" replace />} />
          
          {/* Specific Services */}
          <Route path="/iptu" element={<Iptu />} />
          <Route path="/agendar-consulta" element={<AgendarConsulta />} />
          <Route path="/iluminacao-publica" element={<IluminacaoPublica />} />
          <Route path="/ouvidoria" element={<Ouvidoria />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/esporte" element={<Esporte />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticia/:id" element={<NoticiaDetalhes />} />
          <Route path="/agenda" element={<Navigate to="/" replace />} />
          
          {/* Admin & Panels */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/painel-prefeito" element={<PainelPrefeito />} />
          <Route path="/painel-secretario" element={<PainelSecretario />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
