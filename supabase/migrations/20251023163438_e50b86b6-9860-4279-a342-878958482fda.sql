-- Criar enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'prefeito', 'secretario');

-- Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para checar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Apenas admins podem inserir roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de configurações do app (personalização)
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color TEXT NOT NULL DEFAULT '#1EAEDB',
  secondary_color TEXT NOT NULL DEFAULT '#0FA0CE',
  app_name TEXT NOT NULL DEFAULT 'Portal do Cidadão',
  logo_url TEXT,
  icon_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para app_settings
CREATE POLICY "Todos podem ver configurações"
ON public.app_settings
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem modificar configurações"
ON public.app_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Inserir configuração padrão
INSERT INTO public.app_settings (primary_color, secondary_color, app_name)
VALUES ('#1EAEDB', '#0FA0CE', 'Portal do Cidadão');

-- Tabela para vincular secretários às secretarias
CREATE TABLE public.secretary_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secretaria_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, secretaria_slug)
);

-- Habilitar RLS
ALTER TABLE public.secretary_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas para secretary_assignments
CREATE POLICY "Secretários podem ver suas próprias atribuições"
ON public.secretary_assignments
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'prefeito'));

CREATE POLICY "Apenas admins e prefeito podem gerenciar atribuições"
ON public.secretary_assignments
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'prefeito'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();