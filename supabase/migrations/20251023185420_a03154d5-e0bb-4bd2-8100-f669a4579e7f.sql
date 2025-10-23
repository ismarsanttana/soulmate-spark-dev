-- Adicionar roles 'secretario' e 'prefeito' ao usuário
INSERT INTO public.user_roles (user_id, role)
VALUES ('fa6863e2-7996-4ad2-9857-c07fa05a955a', 'secretario'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('fa6863e2-7996-4ad2-9857-c07fa05a955a', 'prefeito'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar a Secretaria de Comunicação se não existir
INSERT INTO public.secretarias (
  slug,
  name,
  description,
  icon,
  color,
  is_active
)
VALUES (
  'comunicacao',
  'Secretaria de Comunicação',
  'Responsável pela comunicação institucional, notícias, eventos, stories, podcasts, transmissões ao vivo e campanhas publicitárias da cidade.',
  'Radio',
  '#9b87f5',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Criar atribuição do secretário à Secretaria de Comunicação
INSERT INTO public.secretary_assignments (
  user_id,
  secretaria_slug,
  assigned_by
)
VALUES (
  'fa6863e2-7996-4ad2-9857-c07fa05a955a',
  'comunicacao',
  'fa6863e2-7996-4ad2-9857-c07fa05a955a'
)
ON CONFLICT (user_id, secretaria_slug) DO NOTHING;