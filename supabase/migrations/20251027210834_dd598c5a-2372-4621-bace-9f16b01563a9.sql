-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de avatar próprio
CREATE POLICY "Usuários podem fazer upload de seus próprios avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir atualização de avatar próprio
CREATE POLICY "Usuários podem atualizar seus próprios avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir exclusão de avatar próprio
CREATE POLICY "Usuários podem deletar seus próprios avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir visualização pública dos avatares
CREATE POLICY "Avatares são visíveis publicamente"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');