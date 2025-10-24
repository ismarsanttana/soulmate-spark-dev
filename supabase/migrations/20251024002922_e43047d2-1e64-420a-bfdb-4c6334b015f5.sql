-- Tabela de funcionários das secretarias
CREATE TABLE IF NOT EXISTS public.secretaria_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  secretaria_slug TEXT NOT NULL REFERENCES public.secretarias(slug) ON DELETE CASCADE,
  funcao TEXT NOT NULL,
  
  -- Dados pessoais
  matricula TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Dados funcionais
  regime_juridico TEXT,
  cargo TEXT,
  area TEXT,
  chefe_imediato TEXT,
  lotacao TEXT,
  jornada TEXT,
  
  -- Ato de nomeação/contrato
  ato_nomeacao_numero TEXT,
  ato_nomeacao_data DATE,
  ato_nomeacao_arquivo_url TEXT,
  data_exercicio DATE,
  situacao TEXT DEFAULT 'ativo',
  
  -- Equipamentos e termos
  equipamentos JSONB DEFAULT '[]'::jsonb,
  termo_lgpd_assinado BOOLEAN DEFAULT false,
  termo_lgpd_arquivo_url TEXT,
  termo_responsabilidade_assinado BOOLEAN DEFAULT false,
  termo_responsabilidade_arquivo_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_secretaria_employees_secretaria ON public.secretaria_employees(secretaria_slug);
CREATE INDEX idx_secretaria_employees_user ON public.secretaria_employees(user_id);
CREATE INDEX idx_secretaria_employees_cpf ON public.secretaria_employees(cpf);
CREATE INDEX idx_secretaria_employees_matricula ON public.secretaria_employees(matricula);

-- Tabela de registro de ponto eletrônico
CREATE TABLE IF NOT EXISTS public.employee_timeclock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.secretaria_employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  location TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_employee_timeclock_employee ON public.employee_timeclock(employee_id);
CREATE INDEX idx_employee_timeclock_date ON public.employee_timeclock(clock_in);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_secretaria_employees_updated_at
  BEFORE UPDATE ON public.secretaria_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_timeclock_updated_at
  BEFORE UPDATE ON public.employee_timeclock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para secretaria_employees
ALTER TABLE public.secretaria_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários podem gerenciar funcionários de suas secretarias"
  ON public.secretaria_employees
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     secretaria_slug IN (
       SELECT secretaria_slug FROM secretary_assignments 
       WHERE user_id = auth.uid()
     ))
  );

CREATE POLICY "Funcionários podem ver seus próprios dados"
  ON public.secretaria_employees
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies para employee_timeclock
ALTER TABLE public.employee_timeclock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretários podem gerenciar pontos de suas secretarias"
  ON public.employee_timeclock
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'prefeito'::app_role) OR
    (has_role(auth.uid(), 'secretario'::app_role) AND 
     employee_id IN (
       SELECT id FROM secretaria_employees 
       WHERE secretaria_slug IN (
         SELECT secretaria_slug FROM secretary_assignments 
         WHERE user_id = auth.uid()
       )
     ))
  );

CREATE POLICY "Funcionários podem ver e registrar seus próprios pontos"
  ON public.employee_timeclock
  FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM secretaria_employees 
      WHERE user_id = auth.uid()
    )
  );