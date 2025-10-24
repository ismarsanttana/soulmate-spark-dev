-- Adicionar atribuição do usuário portaltvcariri@gmail.com à Secretaria de Educação
INSERT INTO public.secretary_assignments (user_id, secretaria_slug, assigned_by)
VALUES (
  'fa6863e2-7996-4ad2-9857-c07fa05a955a', 
  'educacao',
  'fa6863e2-7996-4ad2-9857-c07fa05a955a'
)
ON CONFLICT DO NOTHING;