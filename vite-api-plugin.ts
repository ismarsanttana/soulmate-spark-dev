import { Plugin } from 'vite';
import { createClient } from '@supabase/supabase-js';

interface CityTheme {
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

export function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    config() {
      return {
        server: {
          proxy: {
            '/api': {}
          }
        }
      };
    },
    configureServer(server) {
      const supabaseUrl = "https://hqhjbelcouanvcrqudbj.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaGpiZWxjb3VhbnZjcnF1ZGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODA0MTIsImV4cCI6MjA3Njc1NjQxMn0.hTcp_XDyNBmd5cX48Vh14D750bwVRWHuORzhK3lONHY";

      const supabase = createClient(supabaseUrl, supabaseKey);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          return next();
        }

        const cityThemeMatch = req.url.match(/^\/api\/cities\/([^\/]+)\/theme$/);
        
        if (cityThemeMatch) {
          const citySlug = cityThemeMatch[1];

          try {
            const { data, error } = await supabase
              .from('cities')
              .select('name, slug, logo_url, primary_color, secondary_color, accent_color')
              .eq('slug', citySlug)
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'City not found' }));
                return;
              }
              throw error;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(JSON.stringify(data));
          } catch (error) {
            console.error('Error fetching city theme:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          
          return;
        }

        next();
      });
    }
  };
}
