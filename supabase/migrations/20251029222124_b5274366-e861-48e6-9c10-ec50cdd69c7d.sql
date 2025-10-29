-- Criar tabela de avaliações agendadas
CREATE TABLE IF NOT EXISTS public.scheduled_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  duration_minutes INTEGER,
  topics TEXT[],
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.scheduled_assessments ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar suas próprias avaliações
CREATE POLICY "Professores podem gerenciar suas avaliações"
ON public.scheduled_assessments
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'professor'::app_role) AND teacher_id = auth.uid()) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  ))
);

-- Alunos podem ver avaliações das suas turmas
CREATE POLICY "Alunos podem ver avaliações das suas turmas"
ON public.scheduled_assessments
FOR SELECT
USING (
  has_role(auth.uid(), 'aluno'::app_role) AND 
  class_id IN (
    SELECT class_id FROM student_enrollments 
    WHERE student_id IN (
      SELECT id FROM students WHERE old_profile_id = auth.uid()
    ) AND status = 'active'
  )
);

-- Criar índices
CREATE INDEX idx_scheduled_assessments_class ON public.scheduled_assessments(class_id);
CREATE INDEX idx_scheduled_assessments_teacher ON public.scheduled_assessments(teacher_id);
CREATE INDEX idx_scheduled_assessments_date ON public.scheduled_assessments(scheduled_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_scheduled_assessments_updated_at
  BEFORE UPDATE ON public.scheduled_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();