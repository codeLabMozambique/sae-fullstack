📊 Modelagem de Dados
Sistema  para Apoio ao aprendizado do estudane
📌 1. Visão Geral

Sistema para conectar estudantes. biblioteca e professores, permitindo:

Envio de perguntas
Permitir acesso à biblioteca digital
Respostas por professores ou IA
Gestão de turmas, disciplinas e escolas

Base tecnológica:

PostgreSQL
Spring Boot
🧱 2. Entidades Principais
👤 USER

Armazena dados de autenticação.

Campo	Tipo	Descrição
user_id	BIGSERIAL	PK
username	VARCHAR(50)	Único
password	VARCHAR(255)	Senha criptografada
email	VARCHAR(100)	Único
role	VARCHAR(20)	STUDENT / PROFESSOR
is_active	BOOLEAN	Status
created_at	TIMESTAMP	Criação
🎓 STUDENT_PROFILE
Campo	Tipo	Descrição
student_id	BIGSERIAL	PK
user_id	BIGINT	FK USER
school_id	BIGINT	FK SCHOOL
grade	VARCHAR(20)	Série
enrollment_date	DATE	Matrícula
👨‍🏫 PROFESSOR_PROFILE
Campo	Tipo	Descrição
professor_id	BIGSERIAL	PK
user_id	BIGINT	FK USER
school_id	BIGINT	FK SCHOOL
department	VARCHAR(100)	Departamento
specialization	VARCHAR(200)	Área
is_online	BOOLEAN	Online
🏫 SCHOOL
Campo	Tipo
school_id	BIGSERIAL
name	VARCHAR(150)
address	VARCHAR(255)
phone	VARCHAR(20)
email	VARCHAR(100)
🏫 CLASSROOM
Campo	Tipo
classroom_id	BIGSERIAL
name	VARCHAR(50)
school_id	BIGINT
academic_year	VARCHAR(10)
is_active	BOOLEAN
📚 SUBJECT
Campo	Tipo
subject_id	BIGSERIAL
name	VARCHAR(100)
description	TEXT
code	VARCHAR(20)
❓ QUESTION
Campo	Tipo
question_id	BIGSERIAL
student_id	BIGINT
subject_id	BIGINT
classroom_id	BIGINT
target_professor_id	BIGINT
title	VARCHAR(200)
content	TEXT
status	VARCHAR(20)
created_at	TIMESTAMP
answer_count	INTEGER
💬 ANSWER
Campo	Tipo
answer_id	BIGSERIAL
question_id	BIGINT
professor_id	BIGINT
content	TEXT
is_ai_generated	BOOLEAN
is_accepted	BOOLEAN
created_at	TIMESTAMP
🔗 3. Tabelas Associativas
👨‍🏫📚 PROFESSOR_CLASSROOM_SUBJECT

Relaciona professor + turma + disciplina

Campo
assignment_id
professor_id
classroom_id
subject_id
🎓🏫 STUDENT_CLASSROOM
Campo
enrollment_id
student_id
classroom_id
enrollment_date
🏫📚 CLASSROOM_SUBJECT
Campo
mapping_id
classroom_id
subject_id
🔄 4. Relacionamentos
Relação	Tipo
USER → STUDENT_PROFILE	1:1
USER → PROFESSOR_PROFILE	1:1
SCHOOL → CLASSROOM	1:N
STUDENT → QUESTION	1:N
QUESTION → ANSWER	1:N
PROFESSOR → ANSWER	1:N
PROFESSOR ↔ CLASSROOM_SUBJECT	N:M
STUDENT ↔ CLASSROOM	N:M
CLASSROOM ↔ SUBJECT	N:M
🧪 5. Normalização

✔ 1FN: Campos atómicos
✔ 2FN: Dependência total da PK
✔ 3FN: Sem dependências transitivas

⚡ 6. Desnormalização (Otimização)
Campo	Tabela	Objetivo
answer_count	QUESTION	Evitar COUNT
subject_name	QUESTION	Evitar JOIN
school_name	CLASSROOM	Performance
is_online	PROFESSOR	Estado rápido
🚀 7. Índices Importantes
user(email)
question(status, created_at)
answer(question_id)
professor(is_online)
full-text search em perguntas
🧩 8. Regras de Negócio
Um utilizador tem 1 perfil (student ou professor)
Uma pergunta pode ter várias respostas
Resposta deve ser:
de professor OU
gerada por IA
Não pode haver:
duplicação de matrícula
duplicação de atribuição professor-turma-disciplina