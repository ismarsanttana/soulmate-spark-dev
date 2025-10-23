-- Fase 1: Reestruturação do Banco de Dados para Sistema Multi-Role (Corrigido)

-- 1. Adicionar CPF à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;

-- Criar índice para performance em buscas por CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- 2. Criar tabela de roles (papéis/funções)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  secretaria_slug TEXT REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_name, secretaria_slug)
);

-- Habilitar RLS na tabela roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para roles
CREATE POLICY "Todos podem ver roles ativos"
  ON public.roles FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem gerenciar roles"
  ON public.roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Adicionar novas colunas à tabela user_roles (mantendo compatibilidade)
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Criar tabela de relacionamentos entre usuários (pais-filhos, etc)
CREATE TABLE IF NOT EXISTS public.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('pai', 'mae', 'responsavel', 'filho', 'tutor')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, related_user_id, relationship_type)
);

-- Habilitar RLS na tabela user_relationships
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_relationships
CREATE POLICY "Usuários podem ver seus próprios relacionamentos"
  ON public.user_relationships FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = related_user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'prefeito')
  );

CREATE POLICY "Admins e secretários podem criar relacionamentos"
  ON public.user_relationships FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'prefeito')
    OR public.has_role(auth.uid(), 'secretario')
  );

CREATE POLICY "Admins e secretários podem atualizar relacionamentos"
  ON public.user_relationships FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'prefeito')
    OR public.has_role(auth.uid(), 'secretario')
  );

CREATE POLICY "Admins e secretários podem deletar relacionamentos"
  ON public.user_relationships FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'prefeito')
    OR public.has_role(auth.uid(), 'secretario')
  );

-- 5. Criar tabela de matrículas de alunos (específico para educação)
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  school_name TEXT,
  grade_level TEXT,
  class_name TEXT,
  school_year TEXT,
  grades JSONB DEFAULT '{}'::jsonb,
  attendance JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS na tabela student_enrollments
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para student_enrollments
CREATE POLICY "Alunos podem ver suas próprias informações"
  ON public.student_enrollments FOR SELECT
  USING (auth.uid() = student_user_id);

CREATE POLICY "Pais podem ver informações dos filhos"
  ON public.student_enrollments FOR SELECT
  USING (
    student_user_id IN (
      SELECT related_user_id 
      FROM public.user_relationships 
      WHERE user_id = auth.uid() 
      AND relationship_type IN ('pai', 'mae', 'responsavel', 'tutor')
    )
  );

CREATE POLICY "Secretários de educação podem gerenciar matrículas"
  ON public.student_enrollments FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'prefeito')
    OR (
      public.has_role(auth.uid(), 'secretario')
      AND EXISTS (
        SELECT 1 FROM public.secretary_assignments
        WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
      )
    )
  );

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_relationships_user_id ON public.user_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_related_user_id ON public.user_relationships(related_user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_type ON public.user_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_matricula ON public.student_enrollments(matricula);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_roles_secretaria ON public.roles(secretaria_slug);
CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(is_active);

-- Trigger para atualizar updated_at em roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em student_enrollments
CREATE TRIGGER update_student_enrollments_updated_at
  BEFORE UPDATE ON public.student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir apenas roles globais (sem secretaria específica)
INSERT INTO public.roles (role_name, secretaria_slug, description, permissions) VALUES
  ('cidadao', NULL, 'Cidadão comum com acesso aos serviços públicos básicos', '["view_public_content", "create_appointments", "view_own_data"]'::jsonb),
  ('admin', NULL, 'Administrador do sistema com acesso total', '["*"]'::jsonb),
  ('prefeito', NULL, 'Prefeito com acesso a todos os painéis e relatórios', '["view_all", "manage_secretarias", "view_reports"]'::jsonb)
ON CONFLICT (role_name, secretaria_slug) DO NOTHING;