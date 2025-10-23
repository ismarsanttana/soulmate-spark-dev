-- Criar tabela para gerenciar filas de atendimento
CREATE TABLE public.attendance_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'psf', 'hospital', 'consultation'
  secretaria_slug TEXT NOT NULL,
  location TEXT, -- Nome do PSF ou Hospital
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_service', 'completed', 'cancelled'
  priority INTEGER DEFAULT 0, -- 0 = normal, 1 = priority
  position INTEGER, -- Position in queue
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_queue ENABLE ROW LEVEL SECURITY;

-- Policies for attendance_queue
CREATE POLICY "Usuários podem ver suas próprias entradas na fila"
ON public.attendance_queue
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias entradas na fila"
ON public.attendance_queue
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Secretários podem ver filas de suas secretarias"
ON public.attendance_queue
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
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

CREATE POLICY "Secretários podem atualizar filas de suas secretarias"
ON public.attendance_queue
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
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

-- Trigger for updated_at
CREATE TRIGGER update_attendance_queue_updated_at
BEFORE UPDATE ON public.attendance_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_attendance_queue_status ON public.attendance_queue(status);
CREATE INDEX idx_attendance_queue_secretaria ON public.attendance_queue(secretaria_slug);
CREATE INDEX idx_attendance_queue_created_at ON public.attendance_queue(created_at);