-- Inserir novas secretarias
INSERT INTO public.secretarias (name, slug, description, icon, color, is_active) VALUES
('Secretaria de Cultura', 'cultura', 'Políticas culturais, eventos e patrimônio histórico', 'Music', '#9333EA', true),
('Secretaria de Saúde', 'saude', 'Atendimento médico, postos de saúde e campanhas de vacinação', 'Heart', '#DC2626', true),
('Secretaria de Assistência Social', 'assistencia', 'Programas sociais, assistência às famílias e inclusão', 'Users', '#0891B2', true),
('Secretaria da Mulher', 'mulher', 'Políticas públicas para mulheres, acolhimento e apoio', 'UserCircle', '#DB2777', true),
('Secretaria de Obras', 'obras', 'Infraestrutura urbana, construções e manutenção', 'Wrench', '#EA580C', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active;