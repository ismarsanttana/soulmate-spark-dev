-- Atualizar aniversários dos alunos para aparecerem no calendário
-- Execute este script no Supabase SQL Editor

-- Adicionar aniversários em outubro/novembro
UPDATE students 
SET birth_date = '2015-10-29'
WHERE full_name = 'Ana Clara Silva Santos';

UPDATE students 
SET birth_date = '2015-10-30'
WHERE full_name = 'João Pedro Oliveira';

UPDATE students 
SET birth_date = '2015-10-31'
WHERE full_name = 'Maria Eduarda Costa';

UPDATE students 
SET birth_date = '2015-11-01'
WHERE full_name = 'Lucas Gabriel Souza';

UPDATE students 
SET birth_date = '2015-11-05'
WHERE full_name = 'Aluno Teste';

-- Verificar as atualizações
SELECT id, full_name, birth_date 
FROM students 
WHERE birth_date >= '2015-10-01' AND birth_date <= '2015-11-30' 
ORDER BY birth_date;
