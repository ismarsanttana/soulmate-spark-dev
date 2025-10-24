-- Inserir dados fictícios de ponto eletrônico para o mês de outubro de 2025
-- Primeiro, vamos buscar um funcionário da educação para usar como exemplo
-- Como não há funcionários ainda, vamos criar um funcionário fictício de exemplo

INSERT INTO secretaria_employees (
  full_name,
  cpf,
  funcao,
  secretaria_slug,
  matricula,
  situacao,
  email,
  phone,
  jornada,
  cargo,
  lotacao
) VALUES (
  'Maria da Silva Santos',
  '123.456.789-00',
  'Professor(a)',
  'educacao',
  'EDU2025001',
  'ativo',
  'maria.santos@educacao.gov.br',
  '(87) 98765-4321',
  '40h semanais',
  'Professor Efetivo',
  'Escola Municipal Centro'
) ON CONFLICT DO NOTHING;

-- Inserir registros de ponto eletrônico para outubro de 2025
-- Semana 1 (1-5 de outubro)
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-01 07:55:00'::timestamptz,
  '2025-10-01 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  'Entrada matutina'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-01 13:00:00'::timestamptz,
  '2025-10-01 17:05:00'::timestamptz,
  'Escola Municipal Centro',
  'Entrada vespertina'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-02 07:58:00'::timestamptz,
  '2025-10-02 12:03:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-02 13:02:00'::timestamptz,
  '2025-10-02 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-03 08:05:00'::timestamptz,
  '2025-10-03 12:10:00'::timestamptz,
  'Escola Municipal Centro',
  'Atrasado'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-03 13:05:00'::timestamptz,
  '2025-10-03 17:02:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

-- Semana 2 (6-10 de outubro)
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-06 07:52:00'::timestamptz,
  '2025-10-06 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-06 13:00:00'::timestamptz,
  '2025-10-06 17:10:00'::timestamptz,
  'Escola Municipal Centro',
  'Reunião pedagógica'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-07 07:55:00'::timestamptz,
  '2025-10-07 12:05:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-07 13:00:00'::timestamptz,
  '2025-10-07 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-08 08:00:00'::timestamptz,
  '2025-10-08 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-08 13:00:00'::timestamptz,
  '2025-10-08 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

-- Semana 3 (13-17 de outubro) - Incluindo um dia sem saída registrada
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-13 07:58:00'::timestamptz,
  '2025-10-13 12:02:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-13 13:00:00'::timestamptz,
  '2025-10-13 17:05:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-14 08:10:00'::timestamptz,
  '2025-10-14 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  'Atrasado - consulta médica'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-14 13:00:00'::timestamptz,
  '2025-10-14 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

-- Dia 15 - Registro sem saída (ainda no trabalho)
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-15 07:55:00'::timestamptz,
  NULL,
  'Escola Municipal Centro',
  'Esqueceu de bater saída'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

-- Semana 4 (20-24 de outubro)
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-20 07:50:00'::timestamptz,
  '2025-10-20 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-20 13:00:00'::timestamptz,
  '2025-10-20 17:08:00'::timestamptz,
  'Escola Municipal Centro',
  'Atendimento aos pais'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-21 07:55:00'::timestamptz,
  '2025-10-21 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-21 13:00:00'::timestamptz,
  '2025-10-21 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-22 08:00:00'::timestamptz,
  '2025-10-22 12:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-22 13:00:00'::timestamptz,
  '2025-10-22 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-23 07:58:00'::timestamptz,
  '2025-10-23 12:01:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-23 13:00:00'::timestamptz,
  '2025-10-23 17:00:00'::timestamptz,
  'Escola Municipal Centro',
  NULL
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';

-- Dia 24 (hoje) - Apenas entrada
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location, notes)
SELECT 
  id,
  '2025-10-24 07:55:00'::timestamptz,
  NULL,
  'Escola Municipal Centro',
  'Trabalhando atualmente'
FROM secretaria_employees WHERE cpf = '123.456.789-00' AND secretaria_slug = 'educacao';