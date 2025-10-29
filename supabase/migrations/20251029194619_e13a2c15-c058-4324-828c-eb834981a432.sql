-- Criar tabela para mapear professores e disciplinas às turmas
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(class_id, teacher_user_id, subject)
);

-- Habilitar RLS
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Professores podem ver suas atribuições"
  ON public.class_teachers
  FOR SELECT
  USING (
    has_role(auth.uid(), 'professor'::app_role) AND teacher_user_id = auth.uid()
  );

CREATE POLICY "Secretários de educação podem gerenciar atribuições"
  ON public.class_teachers
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  );

-- Criar índices para melhor performance
CREATE INDEX idx_class_teachers_class_id ON public.class_teachers(class_id);
CREATE INDEX idx_class_teachers_teacher_id ON public.class_teachers(teacher_user_id);