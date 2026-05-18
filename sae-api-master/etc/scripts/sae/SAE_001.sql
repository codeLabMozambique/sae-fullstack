-- Active: 1754385509161@@127.0.0.1@3306
-- -----------------------------------------------------------------------------
-- SCHEMA ADJUSTMENTS
-- -----------------------------------------------------------------------------
-- Drop and recreate the check constraint to include 'GUEST' and other roles
ALTER TABLE ROLE_TRANSACTION DROP CONSTRAINT IF EXISTS role_transaction_role_check;
ALTER TABLE ROLE_TRANSACTION ADD CONSTRAINT role_transaction_role_check 
CHECK (ROLE IN ('ADMIN', 'STUDENT', 'PROFESSOR', 'ROOT', 'GUEST'));

-- -----------------------------------------------------------------------------
-- HEADER: SISTEMA (ROOT)
-- -----------------------------------------------------------------------------
INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (1, '01', 'HEADER', 'Sistema (Root)', NULL, 1, NULL, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (2, '0101', 'MENU_ITEM', 'Configurações de Rede', '/root/settings', 1, 1, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (3, '0102', 'MENU_ITEM', 'Gestão de Administradores', '/root/admins', 2, 1, 1);

-- -----------------------------------------------------------------------------
-- HEADER: GESTÃO ACADÉMICA (ADMIN)
-- -----------------------------------------------------------------------------
INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (10, '02', 'HEADER', 'Gestão Académica', NULL, 2, NULL, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (11, '0201', 'MENU_ITEM', 'Escolas', '/admin/schools', 1, 10, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (12, '0202', 'MENU_ITEM', 'Turmas e Grades', '/admin/classrooms', 2, 10, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (13, '0203', 'MENU_ITEM', 'Disciplinas', '/admin/subjects', 3, 10, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (14, '0204', 'MENU_ITEM', 'Utilizadores', '/admin/users', 4, 10, 1);

-- -----------------------------------------------------------------------------
-- HEADER: ÁREA DO PROFESSOR (PROFESSOR)
-- -----------------------------------------------------------------------------
INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (20, '03', 'HEADER', 'Área do Professor', NULL, 3, NULL, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (21, '0301', 'MENU_ITEM', 'Painel de Respostas', '/professor/dashboard', 1, 20, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (22, '0302', 'MENU_ITEM', 'Minhas Turmas', '/professor/my-classes', 2, 20, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (23, '0303', 'MENU_ITEM', 'Meus Alunos', '/professor/students', 3, 20, 1);

-- -----------------------------------------------------------------------------
-- HEADER: ÁREA DO ALUNO (STUDENT)
-- -----------------------------------------------------------------------------
INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (30, '04', 'HEADER', 'Área do Aluno', NULL, 4, NULL, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (31, '0401', 'MENU_ITEM', 'Meus Estudos', '/student/dashboard', 1, 30, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (32, '0402', 'MENU_ITEM', 'Dúvidas e Perguntas', '/student/questions', 2, 30, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (33, '0403', 'MENU_ITEM', 'Biblioteca Digital', '/student/library', 3, 30, 1);

-- -----------------------------------------------------------------------------
-- HEADER: PORTAL (GUEST)
-- -----------------------------------------------------------------------------
INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (40, '05', 'HEADER', 'Início', NULL, 5, NULL, 1);

INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (41, '0501', 'MENU_ITEM', 'Biblioteca Digital', '/student/library', 1, 40, 1);

-- -----------------------------------------------------------------------------
-- ROLE_TRANSACTION (Mapping Roles to Menus)
-- -----------------------------------------------------------------------------


ALTER TABLE ROLE_TRANSACTION DROP CONSTRAINT IF EXISTS role_transaction_role_check;
ALTER TABLE ROLE_TRANSACTION ADD CONSTRAINT role_transaction_role_check 
CHECK (ROLE IN ('ADMIN', 'STUDENT', 'PROFESSOR', 'ROOT', 'GUEST'));


-- ROOT Access
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (1, 'ROOT', 1, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (2, 'ROOT', 2, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (3, 'ROOT', 3, 1);

-- ADMIN Access
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (10, 'ADMIN', 10, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (11, 'ADMIN', 11, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (12, 'ADMIN', 12, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (13, 'ADMIN', 13, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (14, 'ADMIN', 14, 1);

-- PROFESSOR Access
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (20, 'PROFESSOR', 20, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (21, 'PROFESSOR', 21, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (22, 'PROFESSOR', 22, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (23, 'PROFESSOR', 23, 1);

-- STUDENT Access
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (30, 'STUDENT', 30, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (31, 'STUDENT', 31, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (32, 'STUDENT', 32, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (33, 'STUDENT', 33, 1);

-- GUEST Access
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (40, 'GUEST', 40, 1);
INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS) VALUES (41, 'GUEST', 41, 1);

-- =============================================================================
-- BLOCO 24 — Ciclos Académicos e Grupos (11ª/12ª)
-- =============================================================================
-- NOTA: o Hibernate (ddl-auto: update) já cria as colunas automaticamente
-- quando o serviço arranca. Este bloco garante os dados iniciais necessários
-- e pode ser re-executado com segurança (IF NOT EXISTS + ON CONFLICT).

-- ── 1. Ciclo nos níveis de classe ─────────────────────────────────────────────
-- IDs: 11=8ª Classe, 12=9ª Classe, 13=10ª Classe, 14=11ª Classe, 15=12ª Classe
ALTER TABLE ac_class_level ADD COLUMN IF NOT EXISTS cycle VARCHAR(10);
UPDATE ac_class_level SET cycle = 'BASICO' WHERE id IN (11, 12, 13) AND (cycle IS NULL OR cycle = '');
UPDATE ac_class_level SET cycle = 'MEDIO'  WHERE id IN (14, 15)     AND (cycle IS NULL OR cycle = '');

-- ── 2. Tabela de grupos académicos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ac_academic_group (
    id               BIGSERIAL PRIMARY KEY,
    status           SMALLINT NOT NULL DEFAULT 1,
    created_by       BIGINT,
    created_date     TIMESTAMP,
    last_modified_by BIGINT,
    last_modified_date TIMESTAMP,
    name             VARCHAR(256) NOT NULL,
    code             VARCHAR(20),
    description      VARCHAR(500),
    school_id        BIGINT REFERENCES ac_school(id)
);

-- Grupos padrão para escola com id=4 (ESG)
INSERT INTO ac_academic_group (id, status, created_by, created_date, last_modified_by, last_modified_date, name, code, school_id) VALUES
(1, 1, 0, NOW(), 0, NOW(), 'Grupo A — Letras com Matemática', 'A', 4),
(2, 1, 0, NOW(), 0, NOW(), 'Grupo B — Ciências com Biologia', 'B', 4),
(3, 1, 0, NOW(), 0, NOW(), 'Grupo C — Ciências Exactas',       'C', 4)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('ac_academic_group', 'id'), 10);

-- ── 3. FK academic_group_id nas turmas ────────────────────────────────────────
ALTER TABLE ac_classroom ADD COLUMN IF NOT EXISTS academic_group_id BIGINT REFERENCES ac_academic_group(id);
UPDATE ac_classroom
   SET academic_group_id = CASE turma_group
                               WHEN 'A' THEN 1
                               WHEN 'B' THEN 2
                               WHEN 'C' THEN 3
                           END
 WHERE turma_group IS NOT NULL
   AND academic_group_id IS NULL;

-- ── 4. FK academic_group_id no currículo ──────────────────────────────────────
ALTER TABLE ac_class_level_subject ADD COLUMN IF NOT EXISTS academic_group_id BIGINT REFERENCES ac_academic_group(id);
UPDATE ac_class_level_subject
   SET academic_group_id = CASE turma_group
                               WHEN 'A' THEN 1
                               WHEN 'B' THEN 2
                               WHEN 'C' THEN 3
                           END
 WHERE turma_group IS NOT NULL
   AND class_level_id IN (14, 15)
   AND academic_group_id IS NULL;

-- ── 5. Ciclo de ensino nos professores ────────────────────────────────────────
ALTER TABLE professor_profile ADD COLUMN IF NOT EXISTS teaching_cycle VARCHAR(10);

-- ── 6. Item de menu: Grupos Académicos (acesso ADMIN) ─────────────────────────
INSERT INTO APP_TRANSACTION (ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (15, '0205', 'MENU_ITEM', 'Grupos Académicos', '/admin/academic/academic-groups', 5, 10, 1)
ON CONFLICT (ID) DO NOTHING;

INSERT INTO ROLE_TRANSACTION (ID, ROLE, APP_TRANSACTION_ID, STATUS)
VALUES (15, 'ADMIN', 15, 1)
ON CONFLICT (ID) DO NOTHING;