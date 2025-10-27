-- Criar tabela para armazenar configurações de APIs das redes sociais
CREATE TABLE IF NOT EXISTS public.social_media_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin')),
  app_id TEXT,
  app_secret_encrypted TEXT,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para contas de redes sociais conectadas
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secretaria_slug TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin')),
  account_name TEXT NOT NULL,
  account_id TEXT,
  page_id TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_publish BOOLEAN DEFAULT false,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(secretaria_slug, platform)
);

-- Criar tabela para histórico de publicações nas redes sociais
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'event', 'story', 'banner', 'agenda', 'podcast', 'live_stream')),
  content_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin')),
  account_id UUID REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
  post_id TEXT,
  post_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'scheduled', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  custom_text TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  engagement_stats JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.social_media_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para social_media_api_keys
CREATE POLICY "Apenas admins podem gerenciar API keys"
  ON public.social_media_api_keys
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para social_media_accounts
CREATE POLICY "Admins podem gerenciar todas as contas"
  ON public.social_media_accounts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'prefeito'::app_role));

CREATE POLICY "Secretários podem gerenciar contas de suas secretarias"
  ON public.social_media_accounts
  FOR ALL
  USING (
    has_role(auth.uid(), 'secretario'::app_role) AND 
    secretaria_slug IN (
      SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Secretários podem ver contas de suas secretarias"
  ON public.social_media_accounts
  FOR SELECT
  USING (
    secretaria_slug IN (
      SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'prefeito'::app_role)
  );

-- Políticas RLS para social_media_posts
CREATE POLICY "Admins e prefeito podem ver todos os posts"
  ON public.social_media_posts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'prefeito'::app_role));

CREATE POLICY "Secretários podem ver posts de suas secretarias"
  ON public.social_media_posts
  FOR SELECT
  USING (
    has_role(auth.uid(), 'secretario'::app_role) AND 
    account_id IN (
      SELECT id FROM social_media_accounts 
      WHERE secretaria_slug IN (
        SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Secretários podem criar posts de suas secretarias"
  ON public.social_media_posts
  FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'secretario'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) AND 
    account_id IN (
      SELECT id FROM social_media_accounts 
      WHERE secretaria_slug IN (
        SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Sistema pode atualizar status dos posts"
  ON public.social_media_posts
  FOR UPDATE
  USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_social_accounts_secretaria ON public.social_media_accounts(secretaria_slug);
CREATE INDEX idx_social_accounts_platform ON public.social_media_accounts(platform);
CREATE INDEX idx_social_posts_content ON public.social_media_posts(content_type, content_id);
CREATE INDEX idx_social_posts_status ON public.social_media_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.social_media_posts(scheduled_at) WHERE status = 'scheduled';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_social_media_api_keys_updated_at
  BEFORE UPDATE ON public.social_media_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();