-- Adicionar campo gallery_images para galeria de fotos nas notícias
ALTER TABLE news ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN news.gallery_images IS 'Array de URLs das imagens da galeria da notícia';