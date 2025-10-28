-- Função para buscar perfil por CPF (acessível apenas para secretários de educação)
CREATE OR REPLACE FUNCTION public.search_profile_by_cpf(_cpf text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  cpf text,
  telefone text,
  endereco_completo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário tem permissão (admin, prefeito ou secretário de educação)
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments 
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Buscar por CPF removendo formatação para comparar
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.cpf,
    p.telefone,
    p.endereco_completo
  FROM profiles p
  WHERE REPLACE(REPLACE(REPLACE(p.cpf, '.', ''), '-', ''), '/', '') = REPLACE(REPLACE(REPLACE(_cpf, '.', ''), '-', ''), '/', '');
END;
$$;