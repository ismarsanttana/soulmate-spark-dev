-- Criar 17 funcionários com created_by preenchido
DO $$
DECLARE
  admin_id uuid;
  horarios text[] := ARRAY['20h', '30h', '40h', '20h', '30h', '40h', '20h', '30h', '40h', '20h', '30h', '40h', '20h', '30h', '40h', '20h', '30h'];
  cargos text[] := ARRAY['Professor', 'Coordenador', 'Diretor', 'Professor', 'Professor', 'Coordenador', 'Professor', 'Professor', 'Secretário Escolar', 'Professor', 'Professor', 'Coordenador', 'Professor', 'Professor', 'Auxiliar', 'Professor', 'Merendeira'];
  salarios numeric[] := ARRAY[3500.00, 4500.00, 6000.00, 3200.00, 3800.00, 4200.00, 3500.00, 3600.00, 3000.00, 3400.00, 3700.00, 4300.00, 3500.00, 3900.00, 2500.00, 3300.00, 2200.00];
  escolas text[] := ARRAY['Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal João Silva', 'Escola Municipal Maria Santos', 'Escola Municipal Maria Santos', 'Escola Municipal Maria Santos', 'Escola Municipal Maria Santos', 'Escola Municipal Maria Santos'];
  i int;
BEGIN
  -- Pegar um usuário admin/secretário para ser o created_by
  SELECT user_id INTO admin_id 
  FROM user_roles 
  WHERE role IN ('admin', 'secretario') 
  LIMIT 1;
  
  -- Se não houver admin, usar o primeiro usuário que encontrar
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM profiles LIMIT 1;
  END IF;

  FOR i IN 1..17 LOOP
    INSERT INTO secretaria_employees (
      full_name, 
      cpf, 
      birth_date, 
      email, 
      phone, 
      address,
      matricula, 
      funcao, 
      cargo,
      jornada,
      salario,
      secretaria_slug, 
      situacao,
      data_exercicio,
      regime_juridico,
      lotacao,
      area,
      created_by
    ) VALUES (
      'Funcionário Educação ' || i,
      LPAD((200000000 + i)::text, 11, '0'),
      CURRENT_DATE - ((25 + (i % 15)) * 365),
      'funcionario' || i || '@educacao.gov.br',
      '(87) 9' || LPAD((1000 + i)::text, 8, '0'),
      'Av. Educação, ' || (i * 10) || ' - Centro, Afogados da Ingazeira - PE',
      'MAT' || LPAD(i::text, 6, '0'),
      cargos[i],
      cargos[i],
      horarios[i],
      salarios[i],
      'educacao',
      'ativo',
      CURRENT_DATE - (180 + i * 5),
      CASE WHEN i % 3 = 0 THEN 'Estatutário' ELSE 'CLT' END,
      escolas[i],
      CASE 
        WHEN cargos[i] LIKE '%Professor%' THEN 'Ensino Fundamental'
        WHEN cargos[i] LIKE '%Coordenador%' THEN 'Coordenação Pedagógica'
        WHEN cargos[i] = 'Diretor' THEN 'Direção'
        ELSE 'Apoio'
      END,
      admin_id
    );
  END LOOP;
END $$;

-- Adicionar alguns registros de ponto para testar relatórios
INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, location)
SELECT 
  e.id,
  CURRENT_DATE - (i || ' days')::interval + '08:00:00'::time,
  CURRENT_DATE - (i || ' days')::interval + '17:00:00'::time,
  e.lotacao
FROM secretaria_employees e
CROSS JOIN generate_series(1, 5) AS i
WHERE e.secretaria_slug = 'educacao'
  AND e.full_name LIKE 'Funcionário Educação%'
LIMIT 85;