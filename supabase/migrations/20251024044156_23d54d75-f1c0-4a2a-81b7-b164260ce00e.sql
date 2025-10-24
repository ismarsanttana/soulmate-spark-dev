-- Create audit log table for employee changes
CREATE TABLE IF NOT EXISTS public.employee_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.secretaria_employees(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  action TEXT NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '{}',
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for secretários to view audit logs of their secretaria employees
CREATE POLICY "Secretários podem ver logs de auditoria de suas secretarias"
ON public.employee_audit_log
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'prefeito') OR
  (has_role(auth.uid(), 'secretario') AND employee_id IN (
    SELECT id FROM public.secretaria_employees 
    WHERE secretaria_slug IN (
      SELECT secretaria_slug FROM public.secretary_assignments 
      WHERE user_id = auth.uid()
    )
  ))
);

-- Policy for inserting audit logs (system can insert)
CREATE POLICY "Sistema pode inserir logs de auditoria"
ON public.employee_audit_log
FOR INSERT
WITH CHECK (true);

-- Create trigger function to log employee changes
CREATE OR REPLACE FUNCTION public.log_employee_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_fields JSONB := '{}';
  old_vals JSONB := '{}';
  new_vals JSONB := '{}';
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Track which fields changed
    IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
      changed_fields := changed_fields || '{"full_name": true}';
      old_vals := old_vals || jsonb_build_object('full_name', OLD.full_name);
      new_vals := new_vals || jsonb_build_object('full_name', NEW.full_name);
    END IF;
    
    IF OLD.cpf IS DISTINCT FROM NEW.cpf THEN
      changed_fields := changed_fields || '{"cpf": true}';
      old_vals := old_vals || jsonb_build_object('cpf', OLD.cpf);
      new_vals := new_vals || jsonb_build_object('cpf', NEW.cpf);
    END IF;
    
    IF OLD.funcao IS DISTINCT FROM NEW.funcao THEN
      changed_fields := changed_fields || '{"funcao": true}';
      old_vals := old_vals || jsonb_build_object('funcao', OLD.funcao);
      new_vals := new_vals || jsonb_build_object('funcao', NEW.funcao);
    END IF;
    
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      changed_fields := changed_fields || '{"email": true}';
      old_vals := old_vals || jsonb_build_object('email', OLD.email);
      new_vals := new_vals || jsonb_build_object('email', NEW.email);
    END IF;
    
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      changed_fields := changed_fields || '{"phone": true}';
      old_vals := old_vals || jsonb_build_object('phone', OLD.phone);
      new_vals := new_vals || jsonb_build_object('phone', NEW.phone);
    END IF;
    
    IF OLD.situacao IS DISTINCT FROM NEW.situacao THEN
      changed_fields := changed_fields || '{"situacao": true}';
      old_vals := old_vals || jsonb_build_object('situacao', OLD.situacao);
      new_vals := new_vals || jsonb_build_object('situacao', NEW.situacao);
    END IF;
    
    IF OLD.salario IS DISTINCT FROM NEW.salario THEN
      changed_fields := changed_fields || '{"salario": true}';
      old_vals := old_vals || jsonb_build_object('salario', OLD.salario);
      new_vals := new_vals || jsonb_build_object('salario', NEW.salario);
    END IF;

    IF OLD.jornada IS DISTINCT FROM NEW.jornada THEN
      changed_fields := changed_fields || '{"jornada": true}';
      old_vals := old_vals || jsonb_build_object('jornada', OLD.jornada);
      new_vals := new_vals || jsonb_build_object('jornada', NEW.jornada);
    END IF;
    
    -- Insert audit log if any fields changed
    IF changed_fields != '{}' THEN
      INSERT INTO public.employee_audit_log (
        employee_id,
        changed_by,
        action,
        changed_fields,
        old_values,
        new_values
      ) VALUES (
        NEW.id,
        COALESCE(auth.uid(), NEW.created_by),
        'UPDATE',
        changed_fields,
        old_vals,
        new_vals
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Log employee creation
    INSERT INTO public.employee_audit_log (
      employee_id,
      changed_by,
      action,
      changed_fields,
      new_values
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.created_by),
      'INSERT',
      '{"created": true}',
      jsonb_build_object(
        'full_name', NEW.full_name,
        'cpf', NEW.cpf,
        'funcao', NEW.funcao,
        'email', NEW.email,
        'phone', NEW.phone
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on employee table
CREATE TRIGGER employee_changes_trigger
AFTER INSERT OR UPDATE ON public.secretaria_employees
FOR EACH ROW
EXECUTE FUNCTION public.log_employee_changes();

-- Add facial_photos column to secretaria_employees if not exists
ALTER TABLE public.secretaria_employees 
ADD COLUMN IF NOT EXISTS facial_photos JSONB DEFAULT '[]';

ALTER TABLE public.secretaria_employees 
ADD COLUMN IF NOT EXISTS autorizacao_reconhecimento_facial BOOLEAN DEFAULT false;