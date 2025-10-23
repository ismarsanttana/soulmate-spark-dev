-- Criar tabela de stories
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  duration INTEGER NOT NULL DEFAULT 5,
  link TEXT,
  status content_status DEFAULT 'published',
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Criar tabela de podcasts
CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration INTEGER,
  category TEXT,
  status content_status DEFAULT 'published',
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de transmissões ao vivo
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de galeria de imagens
CREATE TABLE public.gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de banners de campanhas
CREATE TABLE public.campaign_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  display_type TEXT NOT NULL DEFAULT 'popup' CHECK (display_type IN ('popup', 'banner', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience JSONB DEFAULT '{"geral": true}',
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar tabela de notificações para suportar filtros de público
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{"geral": true}',
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'system' CHECK (notification_type IN ('system', 'news', 'event', 'alert'));

-- Criar tabela de agenda da cidade
CREATE TABLE public.city_agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  category TEXT,
  image_url TEXT,
  status content_status DEFAULT 'published',
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar perfil demográfico na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_informar')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS lgbtqiapn BOOLEAN DEFAULT false;

-- Criar índices para performance
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_secretaria ON public.stories(secretaria_slug);
CREATE INDEX idx_podcasts_secretaria ON public.podcasts(secretaria_slug);
CREATE INDEX idx_live_streams_status ON public.live_streams(status);
CREATE INDEX idx_gallery_secretaria ON public.gallery(secretaria_slug);
CREATE INDEX idx_campaign_banners_active ON public.campaign_banners(is_active);
CREATE INDEX idx_city_agenda_date ON public.city_agenda(event_date);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_agenda ENABLE ROW LEVEL SECURITY;

-- RLS Policies para Stories
CREATE POLICY "Todos podem ver stories publicados" ON public.stories
  FOR SELECT USING (status = 'published' AND expires_at > now());

CREATE POLICY "Secretários podem gerenciar stories de suas secretarias" ON public.stories
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()))
  );

-- RLS Policies para Podcasts
CREATE POLICY "Todos podem ver podcasts publicados" ON public.podcasts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Secretários podem gerenciar podcasts de suas secretarias" ON public.podcasts
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()))
  );

-- RLS Policies para Live Streams
CREATE POLICY "Todos podem ver transmissões ao vivo" ON public.live_streams
  FOR SELECT USING (true);

CREATE POLICY "Secretários podem gerenciar transmissões de suas secretarias" ON public.live_streams
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()))
  );

-- RLS Policies para Galeria
CREATE POLICY "Todos podem ver galeria" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Secretários podem gerenciar galeria de suas secretarias" ON public.gallery
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()))
  );

-- RLS Policies para Banners de Campanha
CREATE POLICY "Todos podem ver banners ativos" ON public.campaign_banners
  FOR SELECT USING (is_active = true AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Secretários podem gerenciar banners de suas secretarias" ON public.campaign_banners
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()))
  );

-- RLS Policies para Agenda da Cidade
CREATE POLICY "Todos podem ver agenda publicada" ON public.city_agenda
  FOR SELECT USING (status = 'published');

CREATE POLICY "Secretários podem gerenciar agenda de suas secretarias" ON public.city_agenda
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()))
  );

-- Criar trigger para atualizar updated_at em campaign_banners
CREATE TRIGGER update_campaign_banners_updated_at
  BEFORE UPDATE ON public.campaign_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();