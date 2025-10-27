-- Dropar políticas antigas de student_attendance
DROP POLICY IF EXISTS "Alunos podem ver sua própria presença" ON public.student_attendance;
DROP POLICY IF EXISTS "Pais podem ver presença dos filhos" ON public.student_attendance;
DROP POLICY IF EXISTS "Professores podem gerenciar presença de suas turmas" ON public.student_attendance;

-- Migrar student_attendance para usar student_id
ALTER TABLE public.student_attendance 
  ADD COLUMN student_id UUID;

-- Migrar dados existentes
UPDATE public.student_attendance sa
SET student_id = s.id
FROM public.students s
WHERE sa.student_user_id = s.old_profile_id;

-- Tornar student_id NOT NULL
ALTER TABLE public.student_attendance 
  ALTER COLUMN student_id SET NOT NULL;

-- Adicionar foreign key
ALTER TABLE public.student_attendance 
  ADD CONSTRAINT student_attendance_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Remover coluna antiga
ALTER TABLE public.student_attendance 
  DROP COLUMN student_user_id CASCADE;

-- Recriar políticas RLS com student_id
CREATE POLICY "Pais podem ver presença dos filhos"
  ON public.student_attendance FOR SELECT
  USING (
    has_role(auth.uid(), 'pai'::app_role) AND 
    student_id IN (
      SELECT student_id 
      FROM parent_student_relationship 
      WHERE parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Professores podem gerenciar presença de suas turmas"
  ON public.student_attendance FOR ALL
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

-- Dropar políticas antigas de student_entry_log
DROP POLICY IF EXISTS "Alunos podem ver seus próprios registros" ON public.student_entry_log;
DROP POLICY IF EXISTS "Pais podem ver registros dos filhos" ON public.student_entry_log;
DROP POLICY IF EXISTS "Secretários e professores podem ver registros" ON public.student_entry_log;
DROP POLICY IF EXISTS "Sistema pode inserir registros" ON public.student_entry_log;

-- Migrar student_entry_log para usar student_id
ALTER TABLE public.student_entry_log 
  ADD COLUMN student_id UUID;

-- Migrar dados existentes
UPDATE public.student_entry_log sel
SET student_id = s.id
FROM public.students s
WHERE sel.student_user_id = s.old_profile_id;

-- Tornar student_id NOT NULL
ALTER TABLE public.student_entry_log 
  ALTER COLUMN student_id SET NOT NULL;

-- Adicionar foreign key
ALTER TABLE public.student_entry_log 
  ADD CONSTRAINT student_entry_log_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Remover coluna antiga
ALTER TABLE public.student_entry_log 
  DROP COLUMN student_user_id CASCADE;

-- Recriar políticas RLS com student_id
CREATE POLICY "Pais podem ver registros dos filhos"
  ON public.student_entry_log FOR SELECT
  USING (
    has_role(auth.uid(), 'pai'::app_role) AND 
    student_id IN (
      SELECT student_id 
      FROM parent_student_relationship 
      WHERE parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Secretários e professores podem ver registros"
  ON public.student_entry_log FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    )) OR
    has_role(auth.uid(), 'professor'::app_role)
  );

CREATE POLICY "Sistema pode inserir registros"
  ON public.student_entry_log FOR INSERT
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON public.student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON public.student_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_student_entry_log_student ON public.student_entry_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_entry_log_timestamp ON public.student_entry_log(timestamp);