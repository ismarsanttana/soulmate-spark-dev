-- Criar usuários de teste básicos
-- IMPORTANTE: Estes usuários são apenas para teste e devem ser removidos em produção

-- Inserir perfis de usuários de teste
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
  is_super_admin,
  role,
  aud
) VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000', 'prefeito@teste.com', crypt('Senha123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"João Prefeito"}', false, 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000000', 'secretario.edu@teste.com', crypt('Senha123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Secretária"}', false, 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000000', 'professor@teste.com', crypt('Senha123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Professor"}', false, 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444'::uuid, '00000000-0000-0000-0000-000000000000', 'aluno@teste.com', crypt('Senha123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Aluna"}', false, 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555'::uuid, '00000000-0000-0000-0000-000000000000', 'pai@teste.com', crypt('Senha123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pedro Pai"}', false, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Inserir perfis na tabela profiles
INSERT INTO public.profiles (id, full_name, email, cpf) VALUES
  ('11111111-1111-1111-1111-111111111111', 'João Prefeito', 'prefeito@teste.com', '111.111.111-11'),
  ('22222222-2222-2222-2222-222222222222', 'Maria Secretária', 'secretario.edu@teste.com', '222.222.222-22'),
  ('33333333-3333-3333-3333-333333333333', 'Carlos Professor', 'professor@teste.com', '333.333.333-33'),
  ('44444444-4444-4444-4444-444444444444', 'Ana Aluna', 'aluno@teste.com', '444.444.444-44'),
  ('55555555-5555-5555-5555-555555555555', 'Pedro Pai', 'pai@teste.com', '555.555.555-55')
ON CONFLICT (id) DO NOTHING;

-- Atribuir roles aos usuários
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'prefeito'),
  ('22222222-2222-2222-2222-222222222222', 'secretario'),
  ('33333333-3333-3333-3333-333333333333', 'professor'),
  ('44444444-4444-4444-4444-444444444444', 'aluno'),
  ('55555555-5555-5555-5555-555555555555', 'pai')
ON CONFLICT (user_id, role) DO NOTHING;