import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Bell, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DownloadPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast.info("Para instalar no iOS: Toque no ícone de compartilhar e selecione 'Adicionar à Tela Inicial'");
      } else {
        toast.error("A instalação não está disponível no momento. Tente acessar pelo navegador Chrome ou Edge.");
      }
      return;
    }

    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success("App instalado com sucesso!");
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error("Seu navegador não suporta notificações");
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success("Notificações ativadas com sucesso!");
    } else if (permission === 'denied') {
      toast.error("Você bloqueou as notificações");
    }
  };

  const appName = appSettings?.app_name || 'Conecta Afogados';
  const appIcon = appSettings?.icon_url || '/placeholder.svg';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <img 
                src={appIcon} 
                alt={appName}
                className="w-24 h-24 rounded-2xl shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {appName}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Instale nosso aplicativo e tenha acesso rápido a todos os serviços da prefeitura
            </p>
          </div>

          {/* Install Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-primary" />
                {isInstalled ? "App Instalado" : "Instalar Aplicativo"}
              </CardTitle>
              <CardDescription>
                {isInstalled 
                  ? "O aplicativo já está instalado no seu dispositivo"
                  : "Instale o aplicativo no seu dispositivo para acesso rápido"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-medium">Aplicativo instalado com sucesso!</p>
                </div>
              ) : (
                <>
                  {isIOS ? (
                    <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="font-medium">Instruções para iOS:</p>
                      <ol className="space-y-2 text-sm list-decimal list-inside">
                        <li>Toque no ícone de compartilhar <span className="font-bold">⎋</span> (na barra inferior do Safari)</li>
                        <li>Role para baixo e toque em "Adicionar à Tela Inicial"</li>
                        <li>Confirme tocando em "Adicionar"</li>
                      </ol>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleInstall}
                      size="lg"
                      className="w-full"
                      disabled={!deferredPrompt}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Instalar Agora
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Notificações Push
              </CardTitle>
              <CardDescription>
                Ative as notificações para receber atualizações importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={requestNotificationPermission}
                variant="outline"
                className="w-full"
              >
                Ativar Notificações
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Vantagens do Aplicativo</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Acesso rápido a todos os serviços",
                  "Funciona offline",
                  "Notificações em tempo real",
                  "Atualizações automáticas",
                  "Sem necessidade de baixar da loja"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DownloadPage;
