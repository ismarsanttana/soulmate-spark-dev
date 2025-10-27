-- Add logo_background_color column to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS logo_background_color TEXT DEFAULT NULL;

COMMENT ON COLUMN public.app_settings.logo_background_color IS 'Cor de fundo da logo (hex) ou NULL para transparente';