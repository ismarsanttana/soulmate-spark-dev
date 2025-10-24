-- Corrigir search_path nas funções para segurança

CREATE OR REPLACE FUNCTION generate_enrollment_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  -- Pega o ano atual
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  -- Busca o último número de sequência do ano
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(matricula FROM 5) AS INTEGER)), 
    0
  ) + 1 INTO sequence_num
  FROM public.student_enrollments
  WHERE matricula LIKE year_prefix || '%';
  
  -- Formata como YYYY + 6 dígitos (ex: 2025000001)
  new_number := year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION set_enrollment_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
    NEW.matricula := generate_enrollment_number();
  END IF;
  RETURN NEW;
END;
$$;