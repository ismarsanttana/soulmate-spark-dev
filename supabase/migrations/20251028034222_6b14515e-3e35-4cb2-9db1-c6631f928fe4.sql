-- Habilitar Realtime para as tabelas de estudantes
-- Isso permite que os pais vejam atualizações em tempo real

-- Configurar REPLICA IDENTITY FULL para capturar todas as mudanças
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.student_attendance REPLICA IDENTITY FULL;
ALTER TABLE public.student_grades REPLICA IDENTITY FULL;
ALTER TABLE public.student_enrollments REPLICA IDENTITY FULL;
ALTER TABLE public.parent_student_relationship REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_student_relationship;