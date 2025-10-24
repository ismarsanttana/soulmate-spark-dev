-- Criar tabela de turmas
CREATE TABLE IF NOT EXISTS public.school_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  school_year TEXT NOT NULL,
  school_name TEXT,
  teacher_user_id UUID REFERENCES auth.users(id),
  max_students INTEGER DEFAULT 40,
  shift TEXT CHECK (shift IN ('matutino', 'vespertino', 'noturno', 'integral')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de faltas/justificativas de funcionários
CREATE TABLE IF NOT EXISTS public.employee_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.secretaria_employees(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  absence_type TEXT NOT NULL CHECK (absence_type IN ('falta', 'ferias', 'atestado', 'licenca')),
  justification TEXT,
  attachment_url TEXT,
  is_justified BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de presença de alunos
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL,
  class_id UUID REFERENCES public.school_classes(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('presente', 'ausente', 'justificado', 'atrasado')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_user_id, attendance_date, class_id)
);

-- Adicionar coluna class_id em student_enrollments
ALTER TABLE public.student_enrollments 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.school_classes(id);

-- Criar função para gerar matrícula automática
CREATE OR REPLACE FUNCTION generate_enrollment_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  -- Pega o ano atual
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  -- Busca o último número de sequência do ano
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(matricula FROM 5) AS INTEGER)), 
    0
  ) + 1 INTO sequence_num
  FROM public.student_enrollments
  WHERE matricula LIKE year_prefix || '%';
  
  -- Formata como YYYY + 6 dígitos (ex: 2025000001)
  new_number := year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar matrícula automaticamente
CREATE OR REPLACE FUNCTION set_enrollment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
    NEW.matricula := generate_enrollment_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_student_enrollment
BEFORE INSERT ON public.student_enrollments
FOR EACH ROW
EXECUTE FUNCTION set_enrollment_number();

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para school_classes
CREATE POLICY "Secretários de educação podem gerenciar turmas"
ON public.school_classes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  )) OR
  (has_role(auth.uid(), 'professor'::app_role) AND teacher_user_id = auth.uid())
);

CREATE POLICY "Professores podem ver suas turmas"
ON public.school_classes
FOR SELECT
USING (
  has_role(auth.uid(), 'professor'::app_role) AND teacher_user_id = auth.uid()
);

-- Políticas RLS para employee_absences
CREATE POLICY "Secretários podem gerenciar faltas de suas secretarias"
ON public.employee_absences
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND employee_id IN (
    SELECT id FROM secretaria_employees 
    WHERE secretaria_slug IN (
      SELECT secretaria_slug FROM secretary_assignments 
      WHERE user_id = auth.uid()
    )
  ))
);

CREATE POLICY "Funcionários podem ver suas próprias faltas"
ON public.employee_absences
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM secretaria_employees WHERE user_id = auth.uid()
  )
);

-- Políticas RLS para student_attendance
CREATE POLICY "Secretários e professores podem gerenciar presença"
ON public.student_attendance
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  )) OR
  (has_role(auth.uid(), 'professor'::app_role) AND class_id IN (
    SELECT id FROM school_classes WHERE teacher_user_id = auth.uid()
  ))
);

CREATE POLICY "Alunos podem ver sua própria presença"
ON public.student_attendance
FOR SELECT
USING (auth.uid() = student_user_id);

CREATE POLICY "Pais podem ver presença dos filhos"
ON public.student_attendance
FOR SELECT
USING (
  student_user_id IN (
    SELECT related_user_id FROM user_relationships
    WHERE user_id = auth.uid() AND relationship_type IN ('pai', 'mae', 'responsavel', 'tutor')
  )
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_school_classes_teacher ON public.school_classes(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_status ON public.school_classes(status);
CREATE INDEX IF NOT EXISTS idx_employee_absences_employee ON public.employee_absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_absences_date ON public.employee_absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON public.student_attendance(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_class ON public.student_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON public.student_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class ON public.student_enrollments(class_id);

-- Criar triggers para updated_at
CREATE TRIGGER update_school_classes_updated_at
BEFORE UPDATE ON public.school_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_absences_updated_at
BEFORE UPDATE ON public.employee_absences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados fake para demonstração
INSERT INTO public.school_classes (class_name, grade_level, school_year, school_name, shift, status) VALUES
  ('1º Ano A', '1º Ano', '2025', 'Escola Municipal João Paulo', 'matutino', 'active'),
  ('1º Ano B', '1º Ano', '2025', 'Escola Municipal João Paulo', 'vespertino', 'active'),
  ('2º Ano A', '2º Ano', '2025', 'Escola Municipal João Paulo', 'matutino', 'active'),
  ('3º Ano A', '3º Ano', '2025', 'Escola Municipal Maria Clara', 'matutino', 'active'),
  ('4º Ano A', '4º Ano', '2025', 'Escola Municipal Maria Clara', 'vespertino', 'active'),
  ('5º Ano A', '5º Ano', '2025', 'Escola Municipal São José', 'integral', 'active');

-- Inserir faltas fake (vou buscar employee_ids existentes depois)
-- Isso será feito via aplicação para garantir que temos employees válidos