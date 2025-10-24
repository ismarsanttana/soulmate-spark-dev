-- Adicionar novas roles ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pai';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cidadao';