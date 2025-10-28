-- Adicionar políticas RLS para permitir secretários de educação visualizarem perfis
-- necessários para a gestão de alunos e responsáveis

-- Permitir que admins, prefeito e secretários de educação vejam todos os perfis
CREATE POLICY "Admins e secretários de educação podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'prefeito'::app_role) OR 
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 
    FROM secretary_assignments 
    WHERE user_id = auth.uid() 
    AND secretaria_slug = 'educacao'
  ))
);

-- Permitir que secretários de educação atualizem perfis de pais e alunos
CREATE POLICY "Secretários de educação podem atualizar perfis relacionados"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'prefeito'::app_role) OR 
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 
    FROM secretary_assignments 
    WHERE user_id = auth.uid() 
    AND secretaria_slug = 'educacao'
  ))
);