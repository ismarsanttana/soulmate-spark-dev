-- Criar novo usuário secretário educação
-- O trigger handle_new_user vai criar automaticamente o perfil
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Inserir usuário na auth.users (o trigger handle_new_user criará o perfil automaticamente)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'edu.secretaria@teste.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Secretário de Educação"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  -- Aguardar um momento para o trigger criar o perfil
  PERFORM pg_sleep(0.1);

  -- Atribuir role de secretário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'secretario');

  -- Atribuir à secretaria de educação
  INSERT INTO public.secretary_assignments (user_id, secretaria_slug)
  VALUES (new_user_id, 'educacao');

  RAISE NOTICE 'Usuário criado: edu.secretaria@teste.com';
END $$;