-- Add secretaria_slug to appointments table
ALTER TABLE public.appointments 
ADD COLUMN secretaria_slug TEXT DEFAULT 'saude' REFERENCES public.secretarias(slug);

-- Add status field to news and events tables
CREATE TYPE public.content_status AS ENUM ('draft', 'pending', 'published');

ALTER TABLE public.news 
ADD COLUMN status content_status DEFAULT 'published';

ALTER TABLE public.events 
ADD COLUMN status content_status DEFAULT 'published';

-- Update RLS policies for news and events to respect status
DROP POLICY IF EXISTS "Notícias são visíveis para todos" ON public.news;
CREATE POLICY "Notícias publicadas são visíveis para todos" 
ON public.news 
FOR SELECT 
USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'prefeito'::app_role));

DROP POLICY IF EXISTS "Eventos são visíveis para todos" ON public.events;
CREATE POLICY "Eventos publicados são visíveis para todos" 
ON public.events 
FOR SELECT 
USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'prefeito'::app_role));