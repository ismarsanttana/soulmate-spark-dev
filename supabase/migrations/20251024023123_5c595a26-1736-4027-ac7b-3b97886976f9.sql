-- Atualizar perfis com nomes corretos
UPDATE public.profiles SET full_name = 'Prefeito Teste' WHERE id = '10f65b3c-9b52-4120-8dce-a24d064dd011';
UPDATE public.profiles SET full_name = 'Secretário Educação' WHERE id = '22c72937-80ef-4895-b007-e9d38f5714aa';
UPDATE public.profiles SET full_name = 'Professor Teste' WHERE id = 'bc3028d3-5903-47bd-a4ec-2b0536388200';
UPDATE public.profiles SET full_name = 'Aluno Teste' WHERE id = '6db12339-ebe3-47a0-bda6-150a45a9db37';
UPDATE public.profiles SET full_name = 'Pai Teste' WHERE id = 'ac9a5c7d-a0c3-433e-808a-5182af030203';

-- Adicionar roles para cada usuário
INSERT INTO public.user_roles (user_id, role) VALUES
  ('10f65b3c-9b52-4120-8dce-a24d064dd011', 'prefeito'),
  ('22c72937-80ef-4895-b007-e9d38f5714aa', 'secretario'),
  ('bc3028d3-5903-47bd-a4ec-2b0536388200', 'professor'),
  ('6db12339-ebe3-47a0-bda6-150a45a9db37', 'aluno'),
  ('ac9a5c7d-a0c3-433e-808a-5182af030203', 'pai')
ON CONFLICT (user_id, role) DO NOTHING;

-- Atribuir secretário à Secretaria de Educação
INSERT INTO public.secretary_assignments (user_id, secretaria_slug, assigned_by)
VALUES ('22c72937-80ef-4895-b007-e9d38f5714aa', 'educacao', '10f65b3c-9b52-4120-8dce-a24d064dd011')
ON CONFLICT DO NOTHING;

-- Criar matrícula para o aluno
INSERT INTO public.student_enrollments (
  student_user_id, 
  matricula, 
  school_name, 
  grade_level, 
  school_year, 
  class_name, 
  status,
  created_by
)
VALUES (
  '6db12339-ebe3-47a0-bda6-150a45a9db37',
  '2025001',
  'Escola Municipal Centro',
  '5º ano',
  '2025',
  'Turma A',
  'active',
  '22c72937-80ef-4895-b007-e9d38f5714aa'
)
ON CONFLICT DO NOTHING;

-- Criar relacionamento pai-filho
INSERT INTO public.user_relationships (
  user_id,
  related_user_id,
  relationship_type,
  created_by
)
VALUES (
  'ac9a5c7d-a0c3-433e-808a-5182af030203',
  '6db12339-ebe3-47a0-bda6-150a45a9db37',
  'pai',
  '22c72937-80ef-4895-b007-e9d38f5714aa'
)
ON CONFLICT DO NOTHING;