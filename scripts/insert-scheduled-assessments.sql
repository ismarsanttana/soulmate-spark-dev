-- Script para inserir provas e trabalhos agendados para o professor Fernando
-- Execute este script no Supabase SQL Editor
-- IMPORTANTE: Execute apenas UMA VEZ para evitar duplicação de dados

-- Limpar avaliações existentes (opcional - apenas se quiser recomeçar)
-- DELETE FROM public.scheduled_assessments WHERE teacher_id = 'ad49f722-203c-490e-af21-f0d388528053';

-- Inserir avaliações para as 3 turmas do professor Fernando
INSERT INTO public.scheduled_assessments (class_id, teacher_id, subject, assessment_type, title, description, scheduled_date, scheduled_time, duration_minutes, topics, status)
VALUES
-- 5º Ano A - Português
('6c68f213-fe39-4d85-affb-d32d26ed84a4', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Prova', 'Prova Bimestral de Português', 'Avaliação sobre interpretação de texto, gramática e produção textual', '2025-11-10', '08:00', 90, ARRAY['Interpretação de texto', 'Verbos', 'Acentuação'], 'scheduled'),
('6c68f213-fe39-4d85-affb-d32d26ed84a4', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Trabalho', 'Trabalho de Leitura', 'Apresentação de livro escolhido pelo aluno', '2025-11-20', '13:00', 60, ARRAY['Leitura', 'Apresentação oral'], 'scheduled'),
('6c68f213-fe39-4d85-affb-d32d26ed84a4', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Prova', 'Avaliação de Produção de Texto', 'Redação narrativa', '2025-12-05', '08:00', 120, ARRAY['Produção textual', 'Narrativa'], 'scheduled'),

-- 5º Ano A - Matemática
('6c68f213-fe39-4d85-affb-d32d26ed84a4', 'ad49f722-203c-490e-af21-f0d388528053', 'Matemática', 'Prova', 'Prova de Matemática', 'Frações, decimais e problemas matemáticos', '2025-11-12', '10:00', 90, ARRAY['Frações', 'Decimais', 'Problemas'], 'scheduled'),
('6c68f213-fe39-4d85-affb-d32d26ed84a4', 'ad49f722-203c-490e-af21-f0d388528053', 'Matemática', 'Trabalho', 'Projeto de Matemática', 'Criação de problemas matemáticos do cotidiano', '2025-11-25', '14:00', 45, ARRAY['Problemas', 'Aplicação prática'], 'scheduled'),

-- 5º Ano B - Português
('53d631bc-8e87-4905-ba30-339473a989cf', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Prova', 'Prova Bimestral de Português', 'Avaliação sobre interpretação de texto e gramática', '2025-11-11', '08:00', 90, ARRAY['Interpretação de texto', 'Substantivos', 'Adjetivos'], 'scheduled'),
('53d631bc-8e87-4905-ba30-339473a989cf', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Trabalho', 'Trabalho em Grupo', 'Teatro baseado em conto infantil', '2025-11-22', '09:00', 120, ARRAY['Teatro', 'Trabalho em grupo'], 'scheduled'),
('53d631bc-8e87-4905-ba30-339473a989cf', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Prova', 'Prova de Ortografia', 'Avaliação de ortografia e pontuação', '2025-12-03', '08:00', 60, ARRAY['Ortografia', 'Pontuação'], 'scheduled'),

-- 5º Ano B - Matemática
('53d631bc-8e87-4905-ba30-339473a989cf', 'ad49f722-203c-490e-af21-f0d388528053', 'Matemática', 'Prova', 'Prova de Matemática', 'Operações e geometria básica', '2025-11-13', '10:00', 90, ARRAY['Operações', 'Geometria'], 'scheduled'),
('53d631bc-8e87-4905-ba30-339473a989cf', 'ad49f722-203c-490e-af21-f0d388528053', 'Matemática', 'Trabalho', 'Maquete Geométrica', 'Construção de formas geométricas', '2025-11-28', '15:00', 60, ARRAY['Geometria', 'Formas'], 'scheduled'),

-- 6º Ano B - Português
('f2387735-d5a6-44e9-94e2-61befc6219cd', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Prova', 'Prova de Literatura', 'Análise de obras literárias', '2025-11-15', '08:00', 120, ARRAY['Literatura', 'Análise literária'], 'scheduled'),
('f2387735-d5a6-44e9-94e2-61befc6219cd', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Trabalho', 'Resenha Crítica', 'Resenha de livro escolhido', '2025-11-26', '13:00', 90, ARRAY['Resenha', 'Crítica literária'], 'scheduled'),
('f2387735-d5a6-44e9-94e2-61befc6219cd', 'ad49f722-203c-490e-af21-f0d388528053', 'Português', 'Prova', 'Prova de Gramática', 'Sintaxe e morfologia', '2025-12-06', '08:00', 90, ARRAY['Sintaxe', 'Morfologia'], 'scheduled'),

-- 6º Ano B - Matemática  
('f2387735-d5a6-44e9-94e2-61befc6219cd', 'ad49f722-203c-490e-af21-f0d388528053', 'Matemática', 'Prova', 'Prova de Álgebra', 'Equações e expressões algébricas', '2025-11-18', '10:00', 90, ARRAY['Equações', 'Álgebra'], 'scheduled'),
('f2387735-d5a6-44e9-94e2-61befc6219cd', 'ad49f722-203c-490e-af21-f0d388528053', 'Matemática', 'Trabalho', 'Projeto de Estatística', 'Pesquisa e análise de dados', '2025-12-02', '14:00', 60, ARRAY['Estatística', 'Gráficos'], 'scheduled');
