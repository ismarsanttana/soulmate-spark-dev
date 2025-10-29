-- Criar tabela para dados específicos dos professores
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carga_horaria_semanal INTEGER DEFAULT 40,
  banco_horas INTEGER DEFAULT 0,
  especialidade TEXT,
  formacao TEXT,
  registro_profissional TEXT,
  data_admissao DATE,
  situacao TEXT DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'afastado', 'licenca', 'inativo')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Policies para teachers
CREATE POLICY "Professores podem ver seus próprios dados"
  ON public.teachers
  FOR SELECT
  USING (
    has_role(auth.uid(), 'professor'::app_role) AND user_id = auth.uid()
  );

CREATE POLICY "Secretários de educação podem gerenciar professores"
  ON public.teachers
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments 
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();