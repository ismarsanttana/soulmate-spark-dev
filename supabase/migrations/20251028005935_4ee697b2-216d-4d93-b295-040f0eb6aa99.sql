-- Remover políticas existentes se houver e criar novas corretas para avatares

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus próprios avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios avatares" ON storage.objects;
DROP POLICY IF EXISTS "Avatares são publicamente visíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios avatares" ON storage.objects;

-- Criar política para upload de avatares
CREATE POLICY "Usuários podem fazer upload de avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND name LIKE auth.uid()::text || '-%'
);

-- Criar política para atualizar avatares
CREATE POLICY "Usuários podem atualizar avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name LIKE auth.uid()::text || '-%'
);

-- Criar política para visualizar avatares (público)
CREATE POLICY "Todos podem ver avatares"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Criar política para deletar avatares
CREATE POLICY "Usuários podem deletar avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name LIKE auth.uid()::text || '-%'
);