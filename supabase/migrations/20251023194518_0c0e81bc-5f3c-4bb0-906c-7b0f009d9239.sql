-- Permitir que secretários, admins e prefeito enviem notificações
CREATE POLICY "Secretários e admins podem enviar notificações"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'prefeito'::app_role) OR
  has_role(auth.uid(), 'secretario'::app_role)
);