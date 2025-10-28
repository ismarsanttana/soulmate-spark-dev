-- Adicionar foreign keys para parent_student_relationship
-- Isso vai permitir que as queries com joins funcionem corretamente

-- Adicionar foreign key para parent_user_id apontando para profiles
ALTER TABLE parent_student_relationship 
ADD CONSTRAINT fk_parent_student_relationship_parent 
FOREIGN KEY (parent_user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Adicionar foreign key para student_id apontando para students
ALTER TABLE parent_student_relationship 
ADD CONSTRAINT fk_parent_student_relationship_student 
FOREIGN KEY (student_id) 
REFERENCES students(id) 
ON DELETE CASCADE;