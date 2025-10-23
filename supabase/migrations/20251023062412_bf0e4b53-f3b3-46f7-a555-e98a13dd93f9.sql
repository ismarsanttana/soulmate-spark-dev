-- Criar tabela de auditoria para appointments
CREATE TABLE IF NOT EXISTS public.appointments_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  accessed_at timestamp with time zone DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text
);

-- Índices para melhor performance nas consultas de auditoria
CREATE INDEX idx_appointments_audit_appointment_id ON public.appointments_audit(appointment_id);
CREATE INDEX idx_appointments_audit_user_id ON public.appointments_audit(user_id);
CREATE INDEX idx_appointments_audit_accessed_at ON public.appointments_audit(accessed_at DESC);

-- RLS na tabela de auditoria
ALTER TABLE public.appointments_audit ENABLE ROW LEVEL SECURITY;

-- Apenas usuários podem ver seus próprios logs de auditoria
CREATE POLICY "Usuários podem ver seus próprios logs de auditoria"
  ON public.appointments_audit
  FOR SELECT
  USING (auth.uid() = user_id);

-- Sistema pode inserir logs (via trigger ou aplicação)
CREATE POLICY "Sistema pode inserir logs de auditoria"
  ON public.appointments_audit
  FOR INSERT
  WITH CHECK (true);

-- Adicionar políticas UPDATE e DELETE para appointments
CREATE POLICY "Usuários podem atualizar seus próprios agendamentos"
  ON public.appointments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios agendamentos"
  ON public.appointments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Adicionar política DELETE para profiles
CREATE POLICY "Usuários podem deletar seu próprio perfil"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);