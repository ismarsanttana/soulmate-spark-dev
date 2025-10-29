-- Remove a constraint que obriga profiles.id estar vinculado a auth.users
-- Alunos não precisam ser usuários autenticados

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Agora profiles podem existir independentemente de auth.users
-- Isso permite criar perfis de alunos sem criar contas de autenticação