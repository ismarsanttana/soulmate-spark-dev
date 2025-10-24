-- Adicionar campo de salário aos funcionários
ALTER TABLE secretaria_employees 
ADD COLUMN salario DECIMAL(10,2);

-- Criar tabela para gastos com publicidade
CREATE TABLE public.advertising_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secretaria_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de gastos
ALTER TABLE public.advertising_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas para advertising_expenses
CREATE POLICY "Secretários podem gerenciar gastos de suas secretarias"
ON public.advertising_expenses
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  (has_role(auth.uid(), 'secretario'::app_role) AND 
   secretaria_slug IN (
     SELECT secretaria_slug 
     FROM secretary_assignments 
     WHERE user_id = auth.uid()
   ))
);

CREATE POLICY "Todos podem ver gastos"
ON public.advertising_expenses
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_advertising_expenses_updated_at
BEFORE UPDATE ON public.advertising_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_advertising_expenses_secretaria ON advertising_expenses(secretaria_slug);
CREATE INDEX idx_advertising_expenses_date ON advertising_expenses(expense_date);
CREATE INDEX idx_advertising_expenses_category ON advertising_expenses(category);