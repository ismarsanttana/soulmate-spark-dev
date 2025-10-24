-- Criar tabela de solicitações entre secretários
CREATE TABLE public.secretary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_secretary_slug TEXT NOT NULL,
  to_secretary_slug TEXT NOT NULL,
  from_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.secretary_requests ENABLE ROW LEVEL SECURITY;

-- Secretários podem criar solicitações
CREATE POLICY "Secretários podem criar solicitações"
ON public.secretary_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'secretario'::app_role)
  AND from_user_id = auth.uid()
  AND from_secretary_slug IN (
    SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
  )
);

-- Secretários podem ver solicitações enviadas ou recebidas
CREATE POLICY "Secretários podem ver suas solicitações"
ON public.secretary_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role)
    AND (
      from_secretary_slug IN (
        SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
      )
      OR to_secretary_slug IN (
        SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
      )
    )
  )
);

-- Secretários podem atualizar solicitações recebidas
CREATE POLICY "Secretários podem atualizar solicitações recebidas"
ON public.secretary_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role)
    AND to_secretary_slug IN (
      SELECT secretaria_slug FROM secretary_assignments WHERE user_id = auth.uid()
    )
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_secretary_requests_updated_at
BEFORE UPDATE ON public.secretary_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_secretary_requests_from ON public.secretary_requests(from_secretary_slug);
CREATE INDEX idx_secretary_requests_to ON public.secretary_requests(to_secretary_slug);
CREATE INDEX idx_secretary_requests_status ON public.secretary_requests(status);