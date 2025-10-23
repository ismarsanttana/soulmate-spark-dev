-- Corrigir RLS de ombudsman_protocols para proteger protocolos anônimos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios protocolos" ON public.ombudsman_protocols;

CREATE POLICY "Usuários podem ver seus próprios protocolos"
ON public.ombudsman_protocols
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role)
    AND category IN (
      SELECT secretaria_slug 
      FROM secretary_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Adicionar RLS para secretários verem appointments de suas secretarias
CREATE POLICY "Secretários podem ver appointments de suas secretarias"
ON public.appointments
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role)
    AND secretaria_slug IN (
      SELECT secretaria_slug 
      FROM secretary_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Adicionar RLS para secretários atualizarem appointments de suas secretarias
CREATE POLICY "Secretários podem atualizar appointments de suas secretarias"
ON public.appointments
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role)
    AND secretaria_slug IN (
      SELECT secretaria_slug 
      FROM secretary_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Adicionar RLS para secretários e admins atualizarem protocolos
CREATE POLICY "Admins e secretários podem atualizar protocolos"
ON public.ombudsman_protocols
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'prefeito'::app_role)
  OR (
    has_role(auth.uid(), 'secretario'::app_role)
    AND category IN (
      SELECT secretaria_slug 
      FROM secretary_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Permitir usuários verem logs de auditoria de appointments acessados por outros
DROP POLICY IF EXISTS "Usuários podem ver seus próprios logs de auditoria" ON public.appointments_audit;

CREATE POLICY "Usuários podem ver logs de auditoria de seus appointments"
ON public.appointments_audit
FOR SELECT
USING (
  auth.uid() = user_id
  OR appointment_id IN (
    SELECT id FROM appointments WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);