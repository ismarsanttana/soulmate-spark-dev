-- Tabela de vagas de emprego do SINE
CREATE TABLE public.job_vacancies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'CLT', -- CLT, PJ, Temporário, Estágio
  workload TEXT, -- Ex: 44h/semana
  benefits TEXT,
  vacancies_count INTEGER NOT NULL DEFAULT 1,
  applications_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, closed, filled
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de candidaturas às vagas
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vacancy_id UUID NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_review, approved, rejected
  resume_url TEXT,
  cover_letter TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(vacancy_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX idx_job_vacancies_status ON public.job_vacancies(status);
CREATE INDEX idx_job_vacancies_expires_at ON public.job_vacancies(expires_at);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_vacancy_id ON public.job_applications(vacancy_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- Enable RLS
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para job_vacancies
CREATE POLICY "Todos podem ver vagas ativas"
ON public.job_vacancies
FOR SELECT
USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at > now())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'secretario'::app_role)
);

CREATE POLICY "Admins e secretários podem gerenciar vagas"
ON public.job_vacancies
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() 
    AND secretaria_slug = 'assistencia'
  ))
);

-- Políticas RLS para job_applications
CREATE POLICY "Usuários podem criar suas candidaturas"
ON public.job_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas próprias candidaturas"
ON public.job_applications
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() 
    AND secretaria_slug = 'assistencia'
  ))
);

CREATE POLICY "Admins e secretários podem atualizar candidaturas"
ON public.job_applications
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'secretario'::app_role) AND EXISTS (
    SELECT 1 FROM secretary_assignments 
    WHERE user_id = auth.uid() 
    AND secretaria_slug = 'assistencia'
  ))
);

-- Trigger para atualizar contador de candidaturas
CREATE OR REPLACE FUNCTION update_vacancy_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_vacancies 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.vacancy_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_vacancies 
    SET applications_count = applications_count - 1 
    WHERE id = OLD.vacancy_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_applications_count_trigger
AFTER INSERT OR DELETE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_vacancy_applications_count();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_job_vacancies_updated_at
BEFORE UPDATE ON public.job_vacancies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();