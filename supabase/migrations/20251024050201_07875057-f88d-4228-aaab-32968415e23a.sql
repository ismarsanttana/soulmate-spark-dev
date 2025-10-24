-- Criar tabela de relatórios gerados
CREATE TABLE public.report_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.secretaria_employees(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  secretaria_slug TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_period TEXT NOT NULL,
  full_data_requested BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Secretários podem criar relatórios de suas secretarias"
ON public.report_requests
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'secretario'::app_role) 
  AND requested_by = auth.uid()
  AND secretaria_slug IN (
    SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Secretários podem ver seus próprios relatórios"
ON public.report_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role) 
    AND (
      requested_by = auth.uid()
      OR secretaria_slug IN (
        SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Admins podem gerenciar todos os relatórios"
ON public.report_requests
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
);

-- Trigger para updated_at
CREATE TRIGGER update_report_requests_updated_at
BEFORE UPDATE ON public.report_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados fictícios
INSERT INTO public.report_requests (
  employee_id,
  requested_by,
  secretaria_slug,
  report_type,
  report_period,
  full_data_requested,
  status,
  approved_by,
  approved_at,
  report_data,
  created_at
)
SELECT 
  e.id,
  sa.user_id,
  e.secretaria_slug,
  'ponto-eletronico',
  '10/2025',
  true,
  'approved',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
  now() - interval '1 day',
  jsonb_build_object(
    'employee', jsonb_build_object(
      'full_name', e.full_name,
      'cpf', e.cpf,
      'matricula', e.matricula,
      'funcao', e.funcao
    ),
    'totalHours', '176h00m'
  ),
  now() - interval '3 days'
FROM public.secretaria_employees e
JOIN secretary_assignments sa ON sa.secretaria_slug = e.secretaria_slug
WHERE e.full_name = 'Maria da Silva Santos'
LIMIT 1;

INSERT INTO public.report_requests (
  employee_id,
  requested_by,
  secretaria_slug,
  report_type,
  report_period,
  full_data_requested,
  status,
  report_data,
  created_at
)
SELECT 
  e.id,
  sa.user_id,
  e.secretaria_slug,
  'ponto-eletronico',
  '09/2025',
  true,
  'pending',
  jsonb_build_object(
    'employee', jsonb_build_object(
      'full_name', e.full_name,
      'cpf', e.cpf,
      'matricula', e.matricula,
      'funcao', e.funcao
    ),
    'totalHours', '168h30m'
  ),
  now() - interval '1 day'
FROM public.secretaria_employees e
JOIN secretary_assignments sa ON sa.secretaria_slug = e.secretaria_slug
WHERE e.full_name = 'Maria da Silva Santos'
LIMIT 1;

INSERT INTO public.report_requests (
  employee_id,
  requested_by,
  secretaria_slug,
  report_type,
  report_period,
  full_data_requested,
  status,
  approved_by,
  approved_at,
  rejection_reason,
  report_data,
  created_at
)
SELECT 
  e.id,
  sa.user_id,
  e.secretaria_slug,
  'ponto-eletronico',
  '08/2025',
  true,
  'rejected',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
  now() - interval '2 hours',
  'Solicitação negada: período muito antigo, solicite ao departamento de RH',
  jsonb_build_object(
    'employee', jsonb_build_object(
      'full_name', e.full_name,
      'cpf', e.cpf,
      'matricula', e.matricula,
      'funcao', e.funcao
    ),
    'totalHours', '172h15m'
  ),
  now() - interval '3 hours'
FROM public.secretaria_employees e
JOIN secretary_assignments sa ON sa.secretaria_slug = e.secretaria_slug
WHERE e.full_name = 'Maria da Silva Santos'
LIMIT 1;