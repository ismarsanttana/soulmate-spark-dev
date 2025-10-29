-- Generalizar cache para todas as APIs
CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_source TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  parameters JSONB,
  response_data JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_api_cache_lookup ON public.api_cache(api_source, endpoint, parameters);
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- Migrar dados do inep_cache para api_cache
INSERT INTO public.api_cache (api_source, endpoint, parameters, response_data, cached_at, expires_at, created_by)
SELECT 'inep', endpoint, parameters, response_data, cached_at, expires_at, created_by
FROM public.inep_cache;

-- Dados IDEB importados
CREATE TABLE IF NOT EXISTS public.ideb_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id),
  codigo_inep TEXT NOT NULL,
  ano INTEGER NOT NULL,
  rede TEXT,
  localizacao TEXT,
  nota_anos_iniciais DECIMAL(3,1),
  nota_anos_finais DECIMAL(3,1),
  nota_ensino_medio DECIMAL(3,1),
  meta_anos_iniciais DECIMAL(3,1),
  meta_anos_finais DECIMAL(3,1),
  meta_ensino_medio DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(codigo_inep, ano)
);

-- Dados orçamentários SICONFI
CREATE TABLE IF NOT EXISTS public.orcamento_educacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  bimestre INTEGER,
  tipo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor_previsto DECIMAL(15,2),
  valor_realizado DECIMAL(15,2),
  percentual_executado DECIMAL(5,2),
  fonte TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_by UUID REFERENCES auth.users(id),
  UNIQUE(ano, bimestre, tipo, categoria)
);

-- Transferências federais Portal Transparência
CREATE TABLE IF NOT EXISTS public.transferencias_federais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER,
  programa TEXT NOT NULL,
  favorecido TEXT,
  cnpj_favorecido TEXT,
  valor DECIMAL(15,2),
  data_pagamento DATE,
  orgao_superior TEXT,
  fonte TEXT DEFAULT 'portal_transparencia',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_transferencias_ano_programa ON public.transferencias_federais(ano, programa);

-- Dados ENEM por escola
CREATE TABLE IF NOT EXISTS public.enem_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id),
  codigo_inep TEXT NOT NULL,
  ano INTEGER NOT NULL,
  media_cn DECIMAL(5,2),
  media_ch DECIMAL(5,2),
  media_lc DECIMAL(5,2),
  media_mt DECIMAL(5,2),
  media_redacao DECIMAL(5,2),
  media_geral DECIMAL(5,2),
  total_participantes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(codigo_inep, ano)
);

-- RLS Policies para api_cache
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários de educação podem gerenciar cache"
ON public.api_cache
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

-- RLS Policies para ideb_data
ALTER TABLE public.ideb_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver dados IDEB"
ON public.ideb_data
FOR SELECT
USING (true);

CREATE POLICY "Secretários de educação podem gerenciar IDEB"
ON public.ideb_data
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

-- RLS Policies para orcamento_educacao
ALTER TABLE public.orcamento_educacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários de educação podem ver orçamento"
ON public.orcamento_educacao
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

CREATE POLICY "Secretários de educação podem gerenciar orçamento"
ON public.orcamento_educacao
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

-- RLS Policies para transferencias_federais
ALTER TABLE public.transferencias_federais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários de educação podem ver transferências"
ON public.transferencias_federais
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

CREATE POLICY "Secretários de educação podem gerenciar transferências"
ON public.transferencias_federais
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

-- RLS Policies para enem_data
ALTER TABLE public.enem_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver dados ENEM"
ON public.enem_data
FOR SELECT
USING (true);

CREATE POLICY "Secretários de educação podem gerenciar ENEM"
ON public.enem_data
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);