import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { useDynamicPWA } from "@/hooks/useDynamicPWA";
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
import Agricultura from "./pages/Agricultura";
import Mulher from "./pages/Mulher";
import Noticias from "./pages/Noticias";
import NoticiaDetalhes from "./pages/NoticiaDetalhes";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import PainelPrefeito from "./pages/PainelPrefeito";
import PainelSecretario from "@/pages/PainelSecretario";
import PainelEducacao from "@/pages/PainelEducacao";
import StudentDetail from "@/pages/StudentDetail";
import PainelProfessor from "./pages/PainelProfessor";
import PainelAluno from "./pages/PainelAluno";
import PainelPais from "./pages/PainelPais";
import SecretariaDetalhes from "./pages/SecretariaDetalhes";
import SecretariasList from "./pages/SecretariasList";
import FacialTest from "./pages/FacialTest";
import ExpoAgro from "./pages/ExpoAgro";
import Download from "./pages/Download";

const queryClient = new QueryClient();

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
          <Route path="/painel-prefeito" element={<PainelPrefeito />} />
          <Route path="/painel-secretario" element={<PainelSecretario />} />
          <Route path="/ascom" element={<PainelSecretario />} />
          <Route path="/edu" element={<PainelEducacao />} />
          <Route path="/edu/aluno/:studentId" element={<StudentDetail />} />
          <Route path="/painel-professor" element={<PainelProfessor />} />
          <Route path="/painel-aluno" element={<PainelAluno />} />
          <Route path="/painel-pais" element={<PainelPais />} />
          <Route path="/facial-test" element={<FacialTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
