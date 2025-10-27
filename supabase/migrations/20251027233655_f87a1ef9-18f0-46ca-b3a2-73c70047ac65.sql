-- Criar tabela de alunos (sem necessidade de user_id)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  gender TEXT,
  
  -- Endereço
  endereco_completo TEXT,
  
  -- Contatos
  telefone TEXT,
  telefone_emergencia TEXT,
  
  -- Documentos
  certidao_nascimento TEXT,
  doc_certidao_url TEXT,
  doc_rg_url TEXT,
  doc_cpf_url TEXT,
  doc_foto_url TEXT,
  doc_historico_escolar_url TEXT,
  doc_comprovante_residencia_url TEXT,
  doc_vacinacao_url TEXT,
  doc_guarda_tutela_url TEXT,
  
  -- Saúde
  cartao_sus TEXT,
  alergias TEXT,
  restricoes_alimentares TEXT,
  medicacoes_continuas TEXT,
  necessidades_especiais TEXT,
  laudo_aee_url TEXT,
  
  -- Naturalidade
  nacionalidade TEXT DEFAULT 'Brasileira',
  naturalidade TEXT,
  
  -- NIS
  nis TEXT,
  
  -- Transporte
  usa_transporte_escolar BOOLEAN DEFAULT false,
  endereco_transporte TEXT,
  ponto_embarque TEXT,
  
  -- Autorizações
  autorizacao_uso_imagem BOOLEAN DEFAULT true,
  autorizacao_busca_medica BOOLEAN DEFAULT true,
  autorizacao_reconhecimento_facial BOOLEAN DEFAULT false,
  
  -- Reconhecimento facial
  facial_photos JSONB DEFAULT '[]'::jsonb,
  
  -- LGBTQIAPN+
  lgbtqiapn BOOLEAN DEFAULT false,
  
  -- Referência ao perfil original (temporária para migração)
  old_profile_id UUID,
  
  -- Metadados
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_cpf ON public.students(cpf);
CREATE INDEX IF NOT EXISTS idx_students_birth_date ON public.students(birth_date);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_old_profile_id ON public.students(old_profile_id);

-- Habilitar RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Criar tabela de relacionamento pais-filhos
CREATE TABLE IF NOT EXISTS public.parent_student_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'pai', 'mae', 'responsavel_legal', 'tutor'
  is_primary BOOLEAN DEFAULT false,
  is_authorized_pickup BOOLEAN DEFAULT true,
  can_view_grades BOOLEAN DEFAULT true,
  can_view_attendance BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON public.parent_student_relationship(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON public.parent_student_relationship(student_id);

-- Habilitar RLS
ALTER TABLE public.parent_student_relationship ENABLE ROW LEVEL SECURITY;

-- Migrar dados de profiles que têm matrículas para a tabela students
INSERT INTO public.students (
  id, -- usar o mesmo ID temporariamente
  old_profile_id,
  full_name,
  birth_date,
  cpf,
  rg,
  gender,
  endereco_completo,
  telefone,
  telefone_emergencia,
  certidao_nascimento,
  doc_certidao_url,
  doc_rg_url,
  doc_cpf_url,
  doc_foto_url,
  doc_historico_escolar_url,
  doc_comprovante_residencia_url,
  doc_vacinacao_url,
  doc_guarda_tutela_url,
  cartao_sus,
  alergias,
  restricoes_alimentares,
  medicacoes_continuas,
  necessidades_especiais,
  laudo_aee_url,
  nacionalidade,
  naturalidade,
  nis,
  usa_transporte_escolar,
  endereco_transporte,
  ponto_embarque,
  autorizacao_uso_imagem,
  autorizacao_busca_medica,
  autorizacao_reconhecimento_facial,
  facial_photos,
  lgbtqiapn,
  created_at,
  updated_at
)
SELECT DISTINCT
  se.student_user_id, -- usar o ID que está em student_enrollments
  p.id,
  p.full_name,
  COALESCE(p.birth_date, CURRENT_DATE - INTERVAL '10 years'),
  p.cpf,
  p.rg,
  p.gender,
  p.endereco_completo,
  p.telefone,
  p.telefone_emergencia,
  p.certidao_nascimento,
  p.doc_certidao_url,
  p.doc_rg_url,
  p.doc_cpf_url,
  p.doc_foto_url,
  p.doc_historico_escolar_url,
  p.doc_comprovante_residencia_url,
  p.doc_vacinacao_url,
  p.doc_guarda_tutela_url,
  p.cartao_sus,
  p.alergias,
  p.restricoes_alimentares,
  p.medicacoes_continuas,
  p.necessidades_especiais,
  p.laudo_aee_url,
  p.nacionalidade,
  p.naturalidade,
  p.nis,
  p.usa_transporte_escolar,
  p.endereco_transporte,
  p.ponto_embarque,
  p.autorizacao_uso_imagem,
  p.autorizacao_busca_medica,
  p.autorizacao_reconhecimento_facial,
  p.facial_photos,
  p.lgbtqiapn,
  p.created_at,
  p.updated_at
FROM public.student_enrollments se
LEFT JOIN public.profiles p ON p.id = se.student_user_id
WHERE se.student_user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Renomear coluna student_user_id para student_id em student_enrollments
ALTER TABLE public.student_enrollments 
  DROP CONSTRAINT IF EXISTS student_enrollments_student_user_id_fkey;

ALTER TABLE public.student_enrollments 
  RENAME COLUMN student_user_id TO student_id;

-- Adicionar foreign key para a tabela students
ALTER TABLE public.student_enrollments 
  ADD CONSTRAINT student_enrollments_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Políticas RLS para students
CREATE POLICY "Secretários de educação podem gerenciar alunos"
  ON public.students FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    )) OR
    (has_role(auth.uid(), 'professor'::app_role))
  );

CREATE POLICY "Pais podem ver dados dos seus filhos"
  ON public.students FOR SELECT
  USING (
    has_role(auth.uid(), 'pai'::app_role) AND 
    id IN (
      SELECT student_id 
      FROM parent_student_relationship 
      WHERE parent_user_id = auth.uid()
    )
  );

-- Políticas RLS para parent_student_relationship
CREATE POLICY "Secretários de educação podem gerenciar relacionamentos"
  ON public.parent_student_relationship FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  );

CREATE POLICY "Pais podem ver seus próprios relacionamentos"
  ON public.parent_student_relationship FOR SELECT
  USING (
    has_role(auth.uid(), 'pai'::app_role) AND 
    parent_user_id = auth.uid()
  );

-- Atualizar políticas de student_enrollments
DROP POLICY IF EXISTS "Alunos podem ver suas próprias matrículas" ON public.student_enrollments;
DROP POLICY IF EXISTS "Pais podem ver matrículas dos filhos" ON public.student_enrollments;
DROP POLICY IF EXISTS "Professores e secretários podem ver matrículas" ON public.student_enrollments;

CREATE POLICY "Pais podem ver matrículas dos filhos"
  ON public.student_enrollments FOR SELECT
  USING (
    has_role(auth.uid(), 'pai'::app_role) AND 
    student_id IN (
      SELECT student_id 
      FROM parent_student_relationship 
      WHERE parent_user_id = auth.uid() AND can_view_grades = true
    )
  );

CREATE POLICY "Professores e secretários podem ver matrículas"
  ON public.student_enrollments FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    )) OR
    (has_role(auth.uid(), 'professor'::app_role))
  );

-- Trigger para updated_at em students
CREATE OR REPLACE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_students_updated_at();

-- Trigger para updated_at em parent_student_relationship
CREATE TRIGGER update_parent_student_relationship_updated_at
  BEFORE UPDATE ON public.parent_student_relationship
  FOR EACH ROW
  EXECUTE FUNCTION public.update_students_updated_at();