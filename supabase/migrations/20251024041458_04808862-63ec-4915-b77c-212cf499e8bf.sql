-- Migração: Sistema de Reconhecimento Facial

-- 1. Adicionar campos necessários na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS facial_photos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS autorizacao_reconhecimento_facial boolean DEFAULT false;

-- 2. Criar bucket para fotos faciais (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('facial-photos', 'facial-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies para bucket facial-photos
CREATE POLICY "Secretários de educação podem fazer upload de fotos faciais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facial-photos' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments 
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  )
);

CREATE POLICY "Secretários de educação podem visualizar fotos faciais"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'facial-photos' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments 
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  )
);

CREATE POLICY "Secretários de educação podem atualizar fotos faciais"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'facial-photos' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments 
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  )
);

CREATE POLICY "Secretários de educação podem deletar fotos faciais"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'facial-photos' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments 
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  )
);

-- 4. Criar tabela de histórico de entrada/saída
CREATE TABLE IF NOT EXISTS student_entry_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('entrada', 'saida')),
  timestamp timestamptz NOT NULL DEFAULT now(),
  device_id text,
  photo_url text,
  recognition_confidence numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS para student_entry_log
ALTER TABLE student_entry_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos podem ver seus próprios registros de entrada"
ON student_entry_log FOR SELECT
TO authenticated
USING (auth.uid() = student_user_id);

CREATE POLICY "Pais podem ver registros de entrada dos filhos"
ON student_entry_log FOR SELECT
TO authenticated
USING (
  student_user_id IN (
    SELECT related_user_id FROM user_relationships
    WHERE user_id = auth.uid() 
    AND relationship_type IN ('pai', 'mae', 'responsavel', 'tutor')
  )
);

CREATE POLICY "Sistema pode inserir registros de entrada"
ON student_entry_log FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Secretários de educação podem ver todos os registros"
ON student_entry_log FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
  )) OR
  (has_role(auth.uid(), 'professor'::app_role) AND student_user_id IN (
    SELECT student_user_id FROM student_enrollments se
    JOIN school_classes sc ON se.class_id = sc.id
    WHERE sc.teacher_user_id = auth.uid()
  ))
);

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_student_entry_log_student ON student_entry_log(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_entry_log_timestamp ON student_entry_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_facial_photos ON profiles USING GIN (facial_photos);

COMMENT ON TABLE student_entry_log IS 'Registro de entradas e saídas via reconhecimento facial';
COMMENT ON COLUMN profiles.facial_photos IS 'Array JSON com URLs das fotos faciais de diferentes ângulos';
COMMENT ON COLUMN profiles.autorizacao_reconhecimento_facial IS 'Autorização LGPD para uso de reconhecimento facial';