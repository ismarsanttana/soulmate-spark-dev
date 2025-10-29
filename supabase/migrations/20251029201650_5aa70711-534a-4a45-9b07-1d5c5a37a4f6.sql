-- Adicionar colunas de reconhecimento facial na tabela teachers
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS facial_photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS autorizacao_reconhecimento_facial BOOLEAN DEFAULT false;