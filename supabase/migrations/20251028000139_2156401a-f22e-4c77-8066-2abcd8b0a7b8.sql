-- Criar tabela de notas dos alunos
CREATE TABLE public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  period TEXT NOT NULL, -- Bimestre/Trimestre
  grade NUMERIC(4,2) NOT NULL CHECK (grade >= 0 AND grade <= 10),
  assessment_type TEXT NOT NULL, -- Tipo de avaliação: 'prova', 'trabalho', 'participacao', 'media_final'
  assessment_date DATE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_grade CHECK (grade >= 0 AND grade <= 10)
);

-- Habilitar RLS
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Pais podem ver notas dos seus filhos"
ON public.student_grades FOR SELECT
USING (
  has_role(auth.uid(), 'pai') AND 
  student_id IN (
    SELECT student_id FROM public.parent_student_relationship WHERE parent_user_id = auth.uid()
  )
);

CREATE POLICY "Secretários e professores podem gerenciar notas"
ON public.student_grades FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'prefeito') OR
  (has_role(auth.uid(), 'secretario') AND EXISTS (
    SELECT 1 FROM public.secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  )) OR
  (has_role(auth.uid(), 'professor') AND teacher_id = auth.uid())
);

CREATE POLICY "Professores podem ver todas as notas de suas turmas"
ON public.student_grades FOR SELECT
USING (
  has_role(auth.uid(), 'professor') AND 
  class_id IN (
    SELECT id FROM public.school_classes WHERE teacher_user_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX idx_student_grades_student ON public.student_grades(student_id);
CREATE INDEX idx_student_grades_class ON public.student_grades(class_id);
CREATE INDEX idx_student_grades_period ON public.student_grades(period);
CREATE INDEX idx_student_grades_date ON public.student_grades(assessment_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_student_grades_updated_at
BEFORE UPDATE ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir notas para os 30 alunos novos
WITH students_enrolled AS (
  SELECT se.student_id, se.class_id
  FROM public.student_enrollments se
  JOIN public.students s ON s.id = se.student_id
  WHERE s.cpf IN ('12345678901','23456789012','34567890123','45678901234','56789012345','67890123456','78901234567','89012345678','90123456789','01234567890','11234567891','22345678902','33456789013','44567890124','55678901235','66789012346','77890123457','88901234568','99012345679','10123456780','21234567891','32345678902','43456789013','54567890124','65678901235','76789012346','87890123457','98901234568','09012345679','10234567890')
),
subjects AS (
  SELECT * FROM (VALUES 
    ('Português'), ('Matemática'), ('Ciências'), ('História'), 
    ('Geografia'), ('Inglês'), ('Educação Física'), ('Arte')
  ) AS s(subject)
),
periods AS (
  SELECT * FROM (VALUES ('1º Bimestre'), ('2º Bimestre')) AS p(period)
),
assessment_types AS (
  SELECT * FROM (VALUES ('Prova 1'), ('Prova 2'), ('Trabalho'), ('Participação')) AS a(type)
)
INSERT INTO public.student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date)
SELECT 
  se.student_id,
  se.class_id,
  subj.subject,
  per.period,
  ROUND((6.0 + random() * 4.0)::numeric, 2), -- Notas entre 6.0 e 10.0
  atype.type,
  CASE 
    WHEN per.period = '1º Bimestre' THEN (CURRENT_DATE - (random() * 60)::int)
    ELSE (CURRENT_DATE - (random() * 30)::int)
  END
FROM students_enrolled se
CROSS JOIN subjects subj
CROSS JOIN periods per
CROSS JOIN assessment_types atype;