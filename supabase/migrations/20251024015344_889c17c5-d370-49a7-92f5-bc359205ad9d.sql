-- Adicionar role de admin ao usuário portaltvcariri@gmail.com para acesso total
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'fa6863e2-7996-4ad2-9857-c07fa05a955a',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;