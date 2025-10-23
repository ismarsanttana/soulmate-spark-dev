import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Saude from "./pages/Saude";
import Educacao from "./pages/Educacao";
import AssistenciaSocial from "./pages/AssistenciaSocial";
import Services from "./pages/Services";
import Secretaria from "./pages/Secretaria";
import Ouvidoria from "./pages/Ouvidoria";
import NotFound from "./pages/NotFound";

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
          <Route path="/servicos" element={<Services />} />
          <Route path="/secretarias/saude" element={<Saude />} />
          <Route path="/secretarias/educacao" element={<Educacao />} />
          <Route path="/secretarias/assistencia" element={<AssistenciaSocial />} />
          <Route path="/secretarias/:slug" element={<Secretaria />} />
          <Route path="/saude" element={<Saude />} />
          <Route path="/educacao" element={<Educacao />} />
          <Route path="/assistencia" element={<AssistenciaSocial />} />
          <Route path="/obras" element={<Navigate to="/secretarias/obras" replace />} />
          <Route path="/financas" element={<Navigate to="/secretarias/financas" replace />} />
          <Route path="/cultura" element={<Navigate to="/secretarias/cultura" replace />} />
          <Route path="/ouvidoria" element={<Ouvidoria />} />
          <Route path="/noticias" element={<Navigate to="/" replace />} />
          <Route path="/noticia/:id" element={<Navigate to="/" replace />} />
          <Route path="/agenda" element={<Navigate to="/" replace />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/notificacoes" element={<Navigate to="/" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
