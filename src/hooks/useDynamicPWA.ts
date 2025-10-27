import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicPWA = () => {
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!settings) return;

    // Update favicon dynamically
    if (settings.icon_url) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = settings.icon_url;
    }

    // Update manifest dynamically
    const manifestData = {
      name: settings.app_name || 'Conecta Afogados',
      short_name: settings.app_name || 'Conecta Afogados',
      description: 'Portal de serviços públicos da Prefeitura de Afogados da Ingazeira-PE',
      theme_color: settings.primary_color || '#1a202c',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: settings.icon_url || '/placeholder.svg',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: settings.icon_url || '/placeholder.svg',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], {
      type: 'application/json',
    });
    const manifestURL = URL.createObjectURL(manifestBlob);

    // Update manifest link
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;

    // Update meta theme-color
    let themeColorMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = settings.primary_color || '#1a202c';

    // Update apple-touch-icon
    let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    if (settings.icon_url) {
      appleTouchIcon.href = settings.icon_url;
    }

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [settings]);
};
