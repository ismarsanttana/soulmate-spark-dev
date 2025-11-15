import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Supabase client for Control Plane (cities table)
// These must be configured via environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`
❌ Error: Missing required environment variables

Required:
  - SUPABASE_URL: Your Supabase project URL
  - SUPABASE_ANON_KEY: Your Supabase anonymous key

These should be configured in Replit Secrets or your deployment environment.
See .env.example for details.
  `);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// API Routes
// GET /api/cities/:slug/theme - Fetch city theme from Control Plane
app.get('/api/cities/:slug/theme', async (req, res) => {
  const citySlug = req.params.slug;
  
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('name, slug, logo_url, primary_color, secondary_color, accent_color')
      .eq('slug', citySlug)
      .single();

    if (error) {
      console.error(`[API] Error fetching city '${citySlug}':`, error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'City not found', slug: citySlug });
      }
      throw error;
    }
    
    console.log(`[API] Successfully fetched city '${citySlug}':`, data);
    
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(data);
  } catch (error) {
    console.error('[API] Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from dist directory
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    // Disable caching for index.html to ensure updates are visible
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// SPA fallback - serve index.html for all other routes (must be last)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(Number(PORT), HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🚀 Conecta Production Server                                  ║
║                                                                 ║
║  Server:    http://${HOST}:${PORT}                          ║
║  API:       http://${HOST}:${PORT}/api                     ║
║  Health:    http://${HOST}:${PORT}/api/health              ║
║  Mode:      Production                                          ║
║  Platform:  Multi-tenant white-label                            ║
║                                                                 ║
║  Ready to serve ${distPath.split('/').pop()} directory         ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
