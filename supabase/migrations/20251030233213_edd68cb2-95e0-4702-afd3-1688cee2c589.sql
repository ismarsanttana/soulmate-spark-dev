-- Remover política existente se houver e criar nova política para permitir acesso público aos stories
DROP POLICY IF EXISTS "Todos podem ver stories publicados" ON stories;

-- Permitir que qualquer pessoa (autenticada ou não) veja stories publicados
CREATE POLICY "Todos podem ver stories publicados"
ON stories
FOR SELECT
USING (status = 'published');
