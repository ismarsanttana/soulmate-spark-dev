-- Adicionar role 'responsavel' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'responsavel';

-- Criar bucket para documentos dos alunos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket de documentos
CREATE POLICY "Secretários de educação podem gerenciar documentos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'student-documents' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
      SELECT 1 FROM secretary_assignments
      WHERE user_id = auth.uid() AND secretaria_slug = 'educacao'
    ))
  )
);

CREATE POLICY "Alunos e responsáveis podem ver seus próprios documentos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-documents' AND (
    -- O caminho do arquivo contém o user_id do aluno
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Ou é um responsável do aluno
    (storage.foldername(name))[1] IN (
      SELECT related_user_id::text FROM user_relationships
      WHERE user_id = auth.uid() AND relationship_type IN ('pai', 'mae', 'responsavel', 'tutor')
    )
  )
);

-- Adicionar campos de documentos e informações complementares aos profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS naturalidade TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nacionalidade TEXT DEFAULT 'Brasileira';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certidao_nascimento TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cartao_sus TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nis TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone_emergencia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endereco_completo TEXT;

-- Documentos (URLs dos arquivos no storage)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_certidao_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_rg_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_cpf_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_vacinacao_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_comprovante_residencia_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_foto_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_historico_escolar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_guarda_tutela_url TEXT;

-- Informações complementares
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS restricoes_alimentares TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medicacoes_continuas TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS necessidades_especiais TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS laudo_aee_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS autorizacao_uso_imagem BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS autorizacao_busca_medica BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usa_transporte_escolar BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endereco_transporte TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ponto_embarque TEXT;