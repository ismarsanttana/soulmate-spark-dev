-- Criar Secretaria de Educação e vincular dados de teste
INSERT INTO public.secretarias (
  slug,
  name,
  description,
  icon,
  color,
  is_active
) VALUES (
  'educacao',
  'Secretaria de Educação',
  'Responsável pela gestão da educação municipal',
  'GraduationCap',
  '#10b981',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Atribuir secretário à Secretaria de Educação
INSERT INTO public.secretary_assignments (user_id, secretaria_slug, assigned_by) VALUES
  ('22222222-2222-2222-2222-222222222222', 'educacao', 'fa6863e2-7996-4ad2-9857-c07fa05a955a')
ON CONFLICT DO NOTHING;

-- Criar funcionário professor na equipe
INSERT INTO public.secretaria_employees (
  id,
  user_id,
  secretaria_slug,
  full_name,
  cpf,
  email,
  funcao,
  matricula,
  cargo,
  situacao,
  created_by
) VALUES (
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333',
  'educacao',
  'Carlos Professor',
  '333.333.333-33',
  'professor@teste.com',
  'Educação - Ensino Fundamental',
  'EDU-001',
  'Professor de Matemática',
  'ativo',
  'fa6863e2-7996-4ad2-9857-c07fa05a955a'
)
ON CONFLICT (matricula) DO NOTHING;

-- Criar matrícula para o aluno
INSERT INTO public.student_enrollments (
  student_user_id,
  matricula,
  school_name,
  school_year,
  grade_level,
  class_name,
  status,
  created_by
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'MAT-2024-001',
  'Escola Municipal Centro',
  '2024',
  '5º Ano',
  'Turma A',
  'active',
  '22222222-2222-2222-2222-222222222222'
)
ON CONFLICT (matricula) DO NOTHING;

-- Criar relacionamento entre pai e aluno
INSERT INTO public.user_relationships (
  user_id,
  related_user_id,
  relationship_type,
  created_by
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  'pai',
  '22222222-2222-2222-2222-222222222222'
)
ON CONFLICT DO NOTHING;