-- Adicionar registros de presença dos últimos 40 dias úteis para os novos alunos
WITH students_enrolled AS (
  SELECT se.student_id, se.class_id
  FROM public.student_enrollments se
  JOIN public.students s ON s.id = se.student_id
  WHERE s.cpf IN ('12345678901','23456789012','34567890123','45678901234','56789012345','67890123456','78901234567','89012345678','90123456789','01234567890','11234567891','22345678902','33456789013','44567890124','55678901235','66789012346','77890123457','88901234568','99012345679','10123456780','21234567891','32345678902','43456789013','54567890124','65678901235','76789012346','87890123457','98901234568','09012345679','10234567890')
),
date_range AS (
  SELECT d::date as attendance_date
  FROM generate_series(CURRENT_DATE - 40, CURRENT_DATE - 1, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
)
INSERT INTO public.student_attendance (student_id, class_id, attendance_date, status)
SELECT 
  se.student_id,
  se.class_id,
  dr.attendance_date,
  CASE 
    WHEN random() < 0.85 THEN 'presente'
    WHEN random() < 0.95 THEN 'ausente'
    ELSE 'justificado'
  END
FROM students_enrolled se
CROSS JOIN date_range dr;