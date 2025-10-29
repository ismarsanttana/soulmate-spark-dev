-- Permitir que secretários de educação insiram profiles de professores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Secretários de educação podem criar profiles de professores'
  ) THEN
    CREATE POLICY "Secretários de educação podem criar profiles de professores"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'prefeito'::app_role) OR
      (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
        SELECT 1 FROM secretary_assignments
        WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
      ))
    );
  END IF;
END $$;