-- ====================================
-- FASE 1: TABELAS E CAMPOS EDUCACENSO
-- ====================================

-- 1. Criar tabela de escolas
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_inep TEXT UNIQUE NOT NULL,
  nome_escola TEXT NOT NULL,
  codigo_municipio_inep TEXT,
  municipio TEXT,
  uf TEXT CHECK (LENGTH(uf) = 2),
  endereco_completo TEXT,
  telefone TEXT,
  email TEXT,
  dependencia_administrativa TEXT CHECK (dependencia_administrativa IN ('municipal', 'estadual', 'federal', 'privada')),
  localizacao TEXT CHECK (localizacao IN ('urbana', 'rural')),
  situacao_funcionamento TEXT CHECK (situacao_funcionamento IN ('ativa', 'paralisada', 'extinta')),
  data_abertura DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schools_codigo_inep ON public.schools(codigo_inep);
CREATE INDEX idx_schools_municipio ON public.schools(codigo_municipio_inep);
CREATE INDEX idx_schools_uf ON public.schools(uf);

-- 2. Adicionar campos Educacenso na tabela students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS raca_cor TEXT CHECK (raca_cor IN ('branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarada')),
ADD COLUMN IF NOT EXISTS bolsa_familia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deficiencias JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tipo_transporte_escolar TEXT CHECK (tipo_transporte_escolar IN ('proprio_municipio', 'terceirizado', 'nao_utiliza')),
ADD COLUMN IF NOT EXISTS poder_publico_responsavel_transporte TEXT CHECK (poder_publico_responsavel_transporte IN ('municipal', 'estadual', 'ambos', 'nao_se_aplica')),
ADD COLUMN IF NOT EXISTS tipo_veiculo_transporte JSONB DEFAULT '[]';

-- 3. Adicionar campos na tabela school_classes
ALTER TABLE public.school_classes
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id),
ADD COLUMN IF NOT EXISTS codigo_inep_turma TEXT,
ADD COLUMN IF NOT EXISTS tipo_mediacao TEXT CHECK (tipo_mediacao IN ('presencial', 'semipresencial', 'ead')) DEFAULT 'presencial',
ADD COLUMN IF NOT EXISTS horario_inicial TIME,
ADD COLUMN IF NOT EXISTS horario_final TIME,
ADD COLUMN IF NOT EXISTS dias_semana JSONB DEFAULT '["segunda", "terca", "quarta", "quinta", "sexta"]';

CREATE INDEX idx_school_classes_school ON public.school_classes(school_id);
CREATE INDEX idx_school_classes_inep ON public.school_classes(codigo_inep_turma);

-- 4. Adicionar campos na tabela secretaria_employees (professores)
ALTER TABLE public.secretaria_employees
ADD COLUMN IF NOT EXISTS codigo_inep_docente TEXT,
ADD COLUMN IF NOT EXISTS escolaridade TEXT CHECK (escolaridade IN ('fundamental_incompleto', 'fundamental_completo', 'medio_completo', 'superior_completo', 'pos_graduacao', 'mestrado', 'doutorado')),
ADD COLUMN IF NOT EXISTS formacao_especifica JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS situacao_curso_superior TEXT CHECK (situacao_curso_superior IN ('concluido', 'andamento', 'nao_possui'));

-- 5. Criar tabela de cache do INEP
CREATE TABLE IF NOT EXISTS public.inep_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  parameters JSONB,
  response_data JSONB,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_inep_cache_lookup ON public.inep_cache(endpoint, (parameters::text));
CREATE INDEX idx_inep_cache_expires ON public.inep_cache(expires_at);

-- 6. Criar tabela de log de sincronização INEP
CREATE TABLE IF NOT EXISTS public.inep_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'update', 'ideb')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  details JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  synced_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_inep_sync_school ON public.inep_sync_log(school_id);
CREATE INDEX idx_inep_sync_date ON public.inep_sync_log(synced_at);

-- ====================================
-- RLS POLICIES
-- ====================================

-- Policies para schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários de educação podem gerenciar escolas"
ON public.schools FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM public.secretary_assignments
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

CREATE POLICY "Professores podem ver escolas"
ON public.schools FOR SELECT
USING (
  has_role(auth.uid(), 'professor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role))
);

-- Policies para inep_cache
ALTER TABLE public.inep_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários de educação podem gerenciar cache INEP"
ON public.inep_cache FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM public.secretary_assignments
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

-- Policies para inep_sync_log
ALTER TABLE public.inep_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários de educação podem ver logs de sincronização"
ON public.inep_sync_log FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM public.secretary_assignments
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

CREATE POLICY "Sistema pode inserir logs de sincronização"
ON public.inep_sync_log FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at na tabela schools
CREATE OR REPLACE FUNCTION public.update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_schools_updated_at();