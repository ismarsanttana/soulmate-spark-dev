-- Criar tabela de secretarias
CREATE TABLE IF NOT EXISTS public.secretarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Building2',
  color TEXT NOT NULL DEFAULT '#1EAEDB',
  phone TEXT,
  email TEXT,
  address TEXT,
  business_hours TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_secretarias_updated_at
  BEFORE UPDATE ON public.secretarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.secretarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver secretarias ativas"
  ON public.secretarias
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem gerenciar secretarias"
  ON public.secretarias
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('app-assets', 'app-assets', true),
  ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para app-assets (logos, ícones)
CREATE POLICY "Todos podem ver assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'app-assets');

CREATE POLICY "Apenas admins podem fazer upload de assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'app-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar assets"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'app-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar assets"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'app-assets' AND has_role(auth.uid(), 'admin'));

-- Políticas de storage para news-images
CREATE POLICY "Todos podem ver imagens de notícias"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'news-images');

CREATE POLICY "Apenas admins podem fazer upload de imagens de notícias"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar imagens de notícias"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar imagens de notícias"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'));

-- Adicionar RLS policies para permitir admins gerenciarem news e events
CREATE POLICY "Admins podem gerenciar notícias"
  ON public.news
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem gerenciar eventos"
  ON public.events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));