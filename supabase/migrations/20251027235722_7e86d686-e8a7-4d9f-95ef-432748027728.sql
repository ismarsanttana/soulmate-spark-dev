-- Inserir 30 alunos de teste
INSERT INTO public.students (full_name, birth_date, gender, cpf, rg, nacionalidade, naturalidade, endereco_completo, telefone_emergencia, cartao_sus, restricoes_alimentares, alergias, usa_transporte_escolar, status) VALUES
('Ana Clara Silva Santos', '2015-03-15', 'Feminino', '12345678901', '1234567', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua das Flores, 123', '(87) 98765-4321', '123456789012345', NULL, NULL, true, 'active'),
('João Pedro Oliveira', '2015-05-20', 'Masculino', '23456789012', '2345678', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Principal, 456', '(87) 98765-4322', '234567890123456', NULL, 'Lactose', false, 'active'),
('Maria Eduarda Costa', '2015-07-10', 'Feminino', '34567890123', '3456789', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Central, 789', '(87) 98765-4323', '345678901234567', 'Vegetariana', NULL, true, 'active'),
('Lucas Gabriel Souza', '2015-09-25', 'Masculino', '45678901234', '4567890', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua do Comércio, 321', '(87) 98765-4324', '456789012345678', NULL, NULL, false, 'active'),
('Beatriz Vitória Lima', '2015-11-30', 'Feminino', '56789012345', '5678901', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. das Américas, 654', '(87) 98765-4325', '567890123456789', NULL, 'Amendoim', true, 'active'),
('Rafael Henrique Pereira', '2014-02-14', 'Masculino', '67890123456', '6789012', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua São José, 987', '(87) 98765-4326', '678901234567890', NULL, NULL, false, 'active'),
('Isabela Cristina Alves', '2014-04-18', 'Feminino', '78901234567', '7890123', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Nova, 147', '(87) 98765-4327', '789012345678901', 'Sem glúten', NULL, true, 'active'),
('Pedro Augusto Martins', '2014-06-22', 'Masculino', '89012345678', '8901234', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Brasil, 258', '(87) 98765-4328', '890123456789012', NULL, NULL, false, 'active'),
('Sophia Fernandes', '2014-08-05', 'Feminino', '90123456789', '9012345', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua da Paz, 369', '(87) 98765-4329', '901234567890123', NULL, 'Frutos do mar', true, 'active'),
('Enzo Miguel Santos', '2014-10-12', 'Masculino', '01234567890', '0123456', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Alegre, 741', '(87) 98765-4330', '012345678901234', NULL, NULL, false, 'active'),
('Valentina Rodrigues', '2013-01-08', 'Feminino', '11234567891', '1123456', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Esperança, 852', '(87) 98765-4331', '112345678912345', NULL, NULL, true, 'active'),
('Davi Lucca Barbosa', '2013-03-16', 'Masculino', '22345678902', '2234567', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Liberdade, 963', '(87) 98765-4332', '223456789023456', 'Vegano', NULL, false, 'active'),
('Helena Marques Dias', '2013-05-21', 'Feminino', '33456789013', '3345678', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Vitória, 159', '(87) 98765-4333', '334567890134567', NULL, 'Corantes', true, 'active'),
('Arthur Silva Rocha', '2013-07-29', 'Masculino', '44567890124', '4456789', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Progresso, 357', '(87) 98765-4334', '445678901245678', NULL, NULL, false, 'active'),
('Alice Ribeiro Castro', '2013-09-11', 'Feminino', '55678901235', '5567890', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Independência, 486', '(87) 98765-4335', '556789012356789', NULL, NULL, true, 'active'),
('Miguel Henrique Campos', '2012-02-03', 'Masculino', '66789012346', '6678901', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua União, 528', '(87) 98765-4336', '667890123467890', NULL, 'Glúten', false, 'active'),
('Laura Beatriz Moreira', '2012-04-27', 'Feminino', '77890123457', '7789012', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Harmonia, 639', '(87) 98765-4337', '778901234578901', 'Sem lactose', NULL, true, 'active'),
('Bernardo Gomes Araújo', '2012-06-15', 'Masculino', '88901234568', '8890123', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Progresso, 741', '(87) 98765-4338', '889012345689012', NULL, NULL, false, 'active'),
('Manuela Santos Correia', '2012-08-19', 'Feminino', '99012345679', '9901234', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Felicidade, 852', '(87) 98765-4339', '990123456790123', NULL, NULL, true, 'active'),
('Gustavo Henrique Pinto', '2012-10-24', 'Masculino', '10123456780', '1012345', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Alegria, 963', '(87) 98765-4340', '101234567801234', NULL, 'Soja', false, 'active'),
('Lorena Vitória Nunes', '2011-01-14', 'Feminino', '21234567891', '2123456', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Saber, 174', '(87) 98765-4341', '212345678912345', NULL, NULL, true, 'active'),
('Gabriel Lucas Cardoso', '2011-03-28', 'Masculino', '32345678902', '3234567', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Educação, 285', '(87) 98765-4342', '323456789023456', NULL, NULL, false, 'active'),
('Júlia Sophia Monteiro', '2011-05-09', 'Feminino', '43456789013', '4345678', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Conhecimento, 396', '(87) 98765-4343', '434567890134567', 'Vegetariana', 'Ovo', true, 'active'),
('Heitor Augusto Freitas', '2011-07-17', 'Masculino', '54567890124', '5456789', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Cultura, 407', '(87) 98765-4344', '545678901245678', NULL, NULL, false, 'active'),
('Melissa Oliveira Teixeira', '2011-09-23', 'Feminino', '65678901235', '6567890', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Arte, 518', '(87) 98765-4345', '656789012356789', NULL, NULL, true, 'active'),
('Nicolas Pereira Azevedo', '2010-02-11', 'Masculino', '76789012346', '7678901', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Ciência, 629', '(87) 98765-4346', '767890123467890', NULL, 'Camarão', false, 'active'),
('Yasmin Costa Ferreira', '2010-04-05', 'Feminino', '87890123457', '8789012', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Futuro, 730', '(87) 98765-4347', '878901234578901', NULL, NULL, true, 'active'),
('Cauã Silva Borges', '2010-06-13', 'Masculino', '98901234568', '9890123', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Amanhã, 841', '(87) 98765-4348', '989012345689012', NULL, NULL, false, 'active'),
('Lívia Fernandes Carvalho', '2010-08-21', 'Feminino', '09012345679', '0901234', 'Brasileira', 'Afogados da Ingazeira-PE', 'Rua Esperança, 952', '(87) 98765-4349', '090123456790123', 'Sem açúcar', NULL, true, 'active'),
('Felipe Rodrigues Cunha', '2010-10-30', 'Masculino', '10234567890', '1023456', 'Brasileira', 'Afogados da Ingazeira-PE', 'Av. Sonho, 163', '(87) 98765-4350', '102345678901234', NULL, NULL, false, 'active');

-- Criar matrículas para os alunos (distribuindo em turmas existentes)
WITH students_data AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.students
  WHERE cpf IN ('12345678901','23456789012','34567890123','45678901234','56789012345','67890123456','78901234567','89012345678','90123456789','01234567890','11234567891','22345678902','33456789013','44567890124','55678901235','66789012346','77890123457','88901234568','99012345679','10123456780','21234567891','32345678902','43456789013','54567890124','65678901235','76789012346','87890123457','98901234568','09012345679','10234567890')
),
classes_data AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as class_rn
  FROM public.school_classes
  WHERE status = 'active'
  LIMIT 10
)
INSERT INTO public.student_enrollments (student_id, class_id, status, school_year)
SELECT s.id, c.id, 'active', '2025'
FROM students_data s
CROSS JOIN LATERAL (SELECT id FROM classes_data WHERE class_rn = ((s.rn - 1) % 10) + 1 LIMIT 1) c;