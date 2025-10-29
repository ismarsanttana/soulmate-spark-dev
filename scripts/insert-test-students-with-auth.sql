-- Script para criar alunos de teste com autenticação
-- Este script cria usuários no auth.users e depois os perfis completos
-- Execute no SQL Editor do Supabase

DO $$
DECLARE
  v_prof_id UUID := 'ad49f722-203c-490e-af21-f0d388528053';
  v_class_5a UUID;
  v_class_5b UUID;
  
  -- IDs dos alunos
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
  
  v_enrollment_id UUID;
BEGIN
  -- Buscar turmas
  SELECT id INTO v_class_5a FROM school_classes WHERE class_name = '5º Ano A' AND teacher_user_id = v_prof_id;
  SELECT id INTO v_class_5b FROM school_classes WHERE class_name = '5º Ano B' AND teacher_user_id = v_prof_id;

  -- Criar usuários no auth.users
  INSERT INTO auth.users (
    id, 
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES 
    (v_aluno1_id, '00000000-0000-0000-0000-000000000000', 'joao.silva@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno2_id, '00000000-0000-0000-0000-000000000000', 'maria.santos@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno3_id, '00000000-0000-0000-0000-000000000000', 'pedro.costa@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno4_id, '00000000-0000-0000-0000-000000000000', 'ana.oliveira@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno5_id, '00000000-0000-0000-0000-000000000000', 'lucas.ferreira@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno6_id, '00000000-0000-0000-0000-000000000000', 'julia.almeida@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno7_id, '00000000-0000-0000-0000-000000000000', 'gabriel.lima@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno8_id, '00000000-0000-0000-0000-000000000000', 'beatriz.souza@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno9_id, '00000000-0000-0000-0000-000000000000', 'rafael.martins@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (v_aluno10_id, '00000000-0000-0000-0000-000000000000', 'isabella.rodrigues@aluno.com', crypt('senha123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Criar identidades
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES
    (v_aluno1_id, v_aluno1_id, v_aluno1_id, '{"sub":"'||v_aluno1_id||'","email":"joao.silva@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno2_id, v_aluno2_id, v_aluno2_id, '{"sub":"'||v_aluno2_id||'","email":"maria.santos@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno3_id, v_aluno3_id, v_aluno3_id, '{"sub":"'||v_aluno3_id||'","email":"pedro.costa@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno4_id, v_aluno4_id, v_aluno4_id, '{"sub":"'||v_aluno4_id||'","email":"ana.oliveira@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno5_id, v_aluno5_id, v_aluno5_id, '{"sub":"'||v_aluno5_id||'","email":"lucas.ferreira@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno6_id, v_aluno6_id, v_aluno6_id, '{"sub":"'||v_aluno6_id||'","email":"julia.almeida@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno7_id, v_aluno7_id, v_aluno7_id, '{"sub":"'||v_aluno7_id||'","email":"gabriel.lima@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno8_id, v_aluno8_id, v_aluno8_id, '{"sub":"'||v_aluno8_id||'","email":"beatriz.souza@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno9_id, v_aluno9_id, v_aluno9_id, '{"sub":"'||v_aluno9_id||'","email":"rafael.martins@aluno.com"}', 'email', now(), now(), now()),
    (v_aluno10_id, v_aluno10_id, v_aluno10_id, '{"sub":"'||v_aluno10_id||'","email":"isabella.rodrigues@aluno.com"}', 'email', now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- ALUNO 1: João Pedro Silva (Desempenho CRÍTICO)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno1_id, 'João Pedro Silva', 'joao.silva@aluno.com', '2014-11-15', '(87) 99999-0001', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno1_id, v_class_5a, '2025000101', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 3.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Dificuldade com operações básicas', v_prof_id),
    (v_enrollment_id, 'Português', 4.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Problemas de interpretação', v_prof_id),
    (v_enrollment_id, 'Ciências', 3.8, 10.0, 'Prova Bimestral', CURRENT_DATE - 14, 'Precisa estudar mais', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status, notes)
  SELECT v_aluno1_id, v_class_5a, CURRENT_DATE - i, 
    CASE WHEN i % 3 = 0 THEN 'ausente' ELSE 'presente' END,
    CASE WHEN i % 3 = 0 THEN 'Falta não justificada' ELSE NULL END
  FROM generate_series(0, 20) AS i;

  -- ALUNO 2: Maria Eduarda Santos (Desempenho EXCELENTE)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno2_id, 'Maria Eduarda Santos', 'maria.santos@aluno.com', '2014-08-22', '(87) 99999-0002', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno2_id, v_class_5a, '2025000102', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 9.8, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Excelente desempenho!', v_prof_id),
    (v_enrollment_id, 'Português', 9.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Ótima redação', v_prof_id),
    (v_enrollment_id, 'Ciências', 10.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 14, 'Perfeito!', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno2_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ALUNO 3: Pedro Henrique Costa (ANIVERSÁRIO HOJE!)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno3_id, 'Pedro Henrique Costa', 'pedro.costa@aluno.com', 
    CONCAT(EXTRACT(YEAR FROM CURRENT_DATE) - 11, '-', 
           LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0'), '-',
           LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0'))::DATE, 
    '(87) 99999-0003', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno3_id, v_class_5a, '2025000103', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 7.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Bom desempenho', v_prof_id),
    (v_enrollment_id, 'Português', 8.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Muito bom', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno3_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ALUNO 4: Ana Clara Oliveira (Aniversário em 3 dias)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno4_id, 'Ana Clara Oliveira', 'ana.oliveira@aluno.com', 
    (CURRENT_DATE + INTERVAL '3 days' - INTERVAL '11 years')::DATE,
    '(87) 99999-0004', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno4_id, v_class_5b, '2025000104', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 8.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Ótimo trabalho', v_prof_id),
    (v_enrollment_id, 'Português', 8.8, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Excelente', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno4_id, v_class_5b, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ALUNO 5: Lucas Gabriel Ferreira (Desempenho BAIXO)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno5_id, 'Lucas Gabriel Ferreira', 'lucas.ferreira@aluno.com', '2014-03-10', '(87) 99999-0005', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno5_id, v_class_5b, '2025000105', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 4.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Precisa de reforço', v_prof_id),
    (v_enrollment_id, 'Português', 5.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Abaixo da média', v_prof_id),
    (v_enrollment_id, 'Ciências', 4.8, 10.0, 'Prova Bimestral', CURRENT_DATE - 14, 'Necessita atenção', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno5_id, v_class_5b, CURRENT_DATE - i, 
    CASE WHEN i % 5 = 0 THEN 'ausente' ELSE 'presente' END
  FROM generate_series(0, 20) AS i;

  -- ALUNO 6: Júlia Vitória Almeida (Desempenho MÉDIO)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno6_id, 'Júlia Vitória Almeida', 'julia.almeida@aluno.com', '2014-12-05', '(87) 99999-0006', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno6_id, v_class_5a, '2025000106', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 7.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Bom', v_prof_id),
    (v_enrollment_id, 'Português', 7.2, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Regular', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno6_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ALUNO 7: Gabriel Henrique Lima (Aniversário amanhã)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno7_id, 'Gabriel Henrique Lima', 'gabriel.lima@aluno.com',
    (CURRENT_DATE + INTERVAL '1 day' - INTERVAL '11 years')::DATE,
    '(87) 99999-0007', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno7_id, v_class_5b, '2025000107', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 8.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Muito bom', v_prof_id),
    (v_enrollment_id, 'Português', 7.8, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Bom trabalho', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno7_id, v_class_5b, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ALUNO 8: Beatriz Souza (Desempenho CRÍTICO)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno8_id, 'Beatriz Souza', 'beatriz.souza@aluno.com', '2014-07-18', '(87) 99999-0008', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno8_id, v_class_5a, '2025000108', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 3.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Necessita acompanhamento urgente', v_prof_id),
    (v_enrollment_id, 'Português', 3.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Muita dificuldade', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno8_id, v_class_5a, CURRENT_DATE - i, 
    CASE WHEN i % 4 = 0 THEN 'ausente' ELSE 'presente' END
  FROM generate_series(0, 20) AS i;

  -- ALUNO 9: Rafael Martins (Desempenho BOM)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno9_id, 'Rafael Martins', 'rafael.martins@aluno.com', '2014-01-30', '(87) 99999-0009', 'masculino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno9_id, v_class_5b, '2025000109', 'Escola Municipal São João', '5º Ano', '5º Ano B', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 8.5, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Excelente', v_prof_id),
    (v_enrollment_id, 'Português', 8.2, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Muito bom', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno9_id, v_class_5b, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  -- ALUNO 10: Isabella Rodrigues (Aniversário em 5 dias)
  INSERT INTO profiles (id, full_name, email, birth_date, telefone, gender)
  VALUES (v_aluno10_id, 'Isabella Rodrigues', 'isabella.rodrigues@aluno.com',
    (CURRENT_DATE + INTERVAL '5 days' - INTERVAL '11 years')::DATE,
    '(87) 99999-0010', 'feminino');
  
  INSERT INTO student_enrollments (student_id, class_id, matricula, school_name, grade_level, class_name, school_year, status)
  VALUES (v_aluno10_id, v_class_5a, '2025000110', 'Escola Municipal São João', '5º Ano', '5º Ano A', '2025', 'active')
  RETURNING id INTO v_enrollment_id;

  INSERT INTO student_grades (enrollment_id, subject, grade, max_grade, exam_type, exam_date, comments, recorded_by)
  VALUES 
    (v_enrollment_id, 'Matemática', 9.0, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Ótima aluna', v_prof_id),
    (v_enrollment_id, 'Português', 9.2, 10.0, 'Prova Bimestral', CURRENT_DATE - 15, 'Excelente trabalho', v_prof_id);

  INSERT INTO student_attendance (student_id, class_id, attendance_date, status)
  SELECT v_aluno10_id, v_class_5a, CURRENT_DATE - i, 'presente'
  FROM generate_series(0, 20) AS i;

  RAISE NOTICE '✅ Script executado com sucesso! 10 alunos criados com autenticação completa.';
  RAISE NOTICE 'Senha padrão para todos: senha123';
END $$;
