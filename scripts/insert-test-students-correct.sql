-- Script corrigido para criar alunos na tabela students
-- Execute no SQL Editor do Supabase

DO $$
DECLARE
  v_prof_id UUID := 'ad49f722-203c-490e-af21-f0d388528053';
  v_class_5a UUID;
  v_class_5b UUID;
  
  v_aluno1_id UUID := gen_random_uuid();
  v_aluno2_id UUID := gen_random_uuid();
  v_aluno3_id UUID := gen_random_uuid();
  v_aluno4_id UUID := gen_random_uuid();
  v_aluno5_id UUID := gen_random_uuid();
  v_aluno6_id UUID := gen_random_uuid();
  v_aluno7_id UUID := gen_random_uuid();
  v_aluno8_id UUID := gen_random_uuid();
  v_aluno9_id UUID := gen_random_uuid();
  v_aluno10_id UUID := gen_random_uuid();
BEGIN
  -- Buscar turmas
  SELECT id INTO v_class_5a FROM school_classes WHERE class_name = '5º Ano A' AND teacher_user_id = v_prof_id;
  SELECT id INTO v_class_5b FROM school_classes WHERE class_name = '5º Ano B' AND teacher_user_id = v_prof_id;

  -- ========== ALUNO 1: João Pedro Silva (Desempenho CRÍTICO) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno1_id, 'João Pedro Silva', '2014-11-15', '(87) 99999-0001', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno1_id, v_class_5a, '2025000101', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno1_id, v_class_5a, 'Matemática', '1º Bimestre', 3.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Dificuldade com operações básicas'),
    (v_aluno1_id, v_class_5a, 'Português', '1º Bimestre', 4.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Problemas de interpretação'),
    (v_aluno1_id, v_class_5a, 'Ciências', '1º Bimestre', 3.8, 'Prova', CURRENT_DATE - 14, v_prof_id, 'Precisa estudar mais');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status, notes)
  SELECT v_aluno1_id, v_class_5a, CURRENT_DATE - i, 
    CASE WHEN i % 3 = 0 THEN 'ausente' ELSE 'presente' END,
    CASE WHEN i % 3 = 0 THEN 'Falta não justificada' ELSE NULL END
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 2: Maria Eduarda Santos (Desempenho EXCELENTE) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno2_id, 'Maria Eduarda Santos', '2014-08-22', '(87) 99999-0002', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno2_id, v_class_5a, '2025000102', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno2_id, v_class_5a, 'Matemática', '1º Bimestre', 9.8, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Excelente desempenho!'),
    (v_aluno2_id, v_class_5a, 'Português', '1º Bimestre', 9.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Ótima redação'),
    (v_aluno2_id, v_class_5a, 'Ciências', '1º Bimestre', 10.0, 'Prova', CURRENT_DATE - 14, v_prof_id, 'Perfeito!');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno2_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 3: Pedro Henrique Costa (ANIVERSÁRIO HOJE!) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno3_id, 'Pedro Henrique Costa',
    CONCAT(EXTRACT(YEAR FROM CURRENT_DATE) - 11, '-', 
           LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0'), '-',
           LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0'))::DATE,
    '(87) 99999-0003', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno3_id, v_class_5a, '2025000103', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno3_id, v_class_5a, 'Matemática', '1º Bimestre', 7.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Bom desempenho'),
    (v_aluno3_id, v_class_5a, 'Português', '1º Bimestre', 8.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Muito bom');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno3_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 4: Ana Clara Oliveira (Aniversário em 3 dias) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno4_id, 'Ana Clara Oliveira',
    (CURRENT_DATE + INTERVAL '3 days' - INTERVAL '11 years')::DATE,
    '(87) 99999-0004', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno4_id, v_class_5b, '2025000104', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno4_id, v_class_5b, 'Matemática', '1º Bimestre', 8.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Ótimo trabalho'),
    (v_aluno4_id, v_class_5b, 'Português', '1º Bimestre', 8.8, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Excelente');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno4_id, v_class_5b, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 5: Lucas Gabriel Ferreira (Desempenho BAIXO) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno5_id, 'Lucas Gabriel Ferreira', '2014-03-10', '(87) 99999-0005', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno5_id, v_class_5b, '2025000105', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno5_id, v_class_5b, 'Matemática', '1º Bimestre', 4.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Precisa de reforço'),
    (v_aluno5_id, v_class_5b, 'Português', '1º Bimestre', 5.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Abaixo da média'),
    (v_aluno5_id, v_class_5b, 'Ciências', '1º Bimestre', 4.8, 'Prova', CURRENT_DATE - 14, v_prof_id, 'Necessita atenção');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno5_id, v_class_5b, CURRENT_DATE - i, 
    CASE WHEN i % 5 = 0 THEN 'ausente' ELSE 'presente' END
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 6: Júlia Vitória Almeida (Desempenho MÉDIO) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno6_id, 'Júlia Vitória Almeida', '2014-12-05', '(87) 99999-0006', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno6_id, v_class_5a, '2025000106', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno6_id, v_class_5a, 'Matemática', '1º Bimestre', 7.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Bom'),
    (v_aluno6_id, v_class_5a, 'Português', '1º Bimestre', 7.2, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Regular');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno6_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 7: Gabriel Henrique Lima (Aniversário amanhã) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno7_id, 'Gabriel Henrique Lima',
    (CURRENT_DATE + INTERVAL '1 day' - INTERVAL '11 years')::DATE,
    '(87) 99999-0007', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno7_id, v_class_5b, '2025000107', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno7_id, v_class_5b, 'Matemática', '1º Bimestre', 8.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Muito bom'),
    (v_aluno7_id, v_class_5b, 'Português', '1º Bimestre', 7.8, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Bom trabalho');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno7_id, v_class_5b, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 8: Beatriz Souza (Desempenho CRÍTICO) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno8_id, 'Beatriz Souza', '2014-07-18', '(87) 99999-0008', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno8_id, v_class_5a, '2025000108', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno8_id, v_class_5a, 'Matemática', '1º Bimestre', 3.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Necessita acompanhamento urgente'),
    (v_aluno8_id, v_class_5a, 'Português', '1º Bimestre', 3.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Muita dificuldade');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno8_id, v_class_5a, CURRENT_DATE - i, 
    CASE WHEN i % 4 = 0 THEN 'ausente' ELSE 'presente' END
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 9: Rafael Martins (Desempenho BOM) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno9_id, 'Rafael Martins', '2014-01-30', '(87) 99999-0009', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno9_id, v_class_5b, '2025000109', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno9_id, v_class_5b, 'Matemática', '1º Bimestre', 8.5, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Excelente'),
    (v_aluno9_id, v_class_5b, 'Português', '1º Bimestre', 8.2, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Muito bom');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno9_id, v_class_5b, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ========== ALUNO 10: Isabella Rodrigues (Aniversário em 5 dias) ==========
  INSERT INTO students (id, full_name, birth_date, telefone, gender)
  VALUES (v_aluno10_id, 'Isabella Rodrigues',
    (CURRENT_DATE + INTERVAL '5 days' - INTERVAL '11 years')::DATE,
    '(87) 99999-0010', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno10_id, v_class_5a, '2025000110', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active');

  INSERT INTO student_grades (student_id, class_id, subject, period, grade, assessment_type, assessment_date, teacher_id, comments)
  VALUES 
    (v_aluno10_id, v_class_5a, 'Matemática', '1º Bimestre', 9.0, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Ótima aluna'),
    (v_aluno10_id, v_class_5a, 'Português', '1º Bimestre', 9.2, 'Prova', CURRENT_DATE - 15, v_prof_id, 'Excelente trabalho');

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno10_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  RAISE NOTICE '✅ 10 alunos criados com sucesso nas turmas do Professor Fernando!';
END $$;
