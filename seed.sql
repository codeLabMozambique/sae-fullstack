-- ============================================================
-- SAE - SEED DE DADOS PARA DESENVOLVIMENTO
-- Base de Dados: sae_db (PostgreSQL 5432)
-- Executar com: psql -U postgres -d sae_db -f seed.sql
-- ============================================================
-- Ordem obrigatória (FKs):
--   app_transaction → role_transaction
--   ac_school → ac_class_level → ac_classroom
--   ac_subject (independente)
-- ============================================================

-- Corrigir schema: Hibernate update não remove NOT NULL automaticamente


-- ============================================================
-- 1. APP_TRANSACTION — Estrutura de Menus por Role
-- STATUS: 1 = ATIVO | TYPE: 'HEADER' ou 'MENU_ITEM'
-- ============================================================

CREATE TABLE IF NOT EXISTS app_transaction (
    ID BIGSERIAL PRIMARY KEY,
    STATUS SMALLINT NOT NULL DEFAULT 1,
    CODE VARCHAR(64) NOT NULL UNIQUE,
    TYPE VARCHAR(64) NOT NULL,
    LABEL VARCHAR(256) NOT NULL,
    ROUTER_LINK VARCHAR(256),
    POSITION BIGINT NOT NULL,
    PARENT_ID BIGINT REFERENCES app_transaction(ID)
);

-- -----------------------------------------------------------------------------
-- ROLE_TRANSACTION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_transaction (
    ID BIGSERIAL PRIMARY KEY,
    STATUS SMALLINT NOT NULL DEFAULT 1,
    ROLE VARCHAR(64) NOT NULL,
    APP_TRANSACTION_ID BIGINT REFERENCES app_transaction(ID)
);



INSERT INTO app_transaction (id, status, code, type, label, router_link, position, parent_id) VALUES

-- ── STUDENT ─────────────────────────────────────────────────
(1,  1, 'STD-001',     'HEADER',    'Dashboard',          '/student/dashboard',          1, NULL),
(2,  1, 'STD-002',     'HEADER',    'Fórum',              '/student/forum',              2, NULL),
(3,  1, 'STD-001-001', 'MENU_ITEM', 'Minhas Aulas',       '/student/classes',            1, 1),
(4,  1, 'STD-001-002', 'MENU_ITEM', 'Notas',              '/student/grades',             2, 1),
(5,  1, 'STD-002-001', 'MENU_ITEM', 'Minhas Perguntas',   '/student/forum/questions',    1, 2),
(6,  1, 'STD-002-002', 'MENU_ITEM', 'Nova Pergunta',      '/student/forum/new',          2, 2),

-- ── PROFESSOR ───────────────────────────────────────────────
(10, 1, 'PRF-001',     'HEADER',    'Dashboard',           '/professor/dashboard',        1, NULL),
(11, 1, 'PRF-002',     'HEADER',    'Fórum',               '/professor/forum',            2, NULL),
(12, 1, 'PRF-001-001', 'MENU_ITEM', 'Minhas Turmas',       '/professor/classes',          1, 10),
(13, 1, 'PRF-001-002', 'MENU_ITEM', 'Gestão de Notas',     '/professor/grades',           2, 10),
(14, 1, 'PRF-002-001', 'MENU_ITEM', 'Perguntas Pendentes', '/professor/forum/pending',    1, 11),
(15, 1, 'PRF-002-002', 'MENU_ITEM', 'Respondidas',         '/professor/forum/answered',   2, 11),

-- ── ADMIN ───────────────────────────────────────────────────
(20, 1, 'ADM-001',     'HEADER',    'Utilizadores',       '/admin/users',                1, NULL),
(21, 1, 'ADM-002',     'HEADER',    'Académico',          '/admin/academic',             2, NULL),
(22, 1, 'ADM-001-001', 'MENU_ITEM', 'Listar Utilizadores','/admin/users/list',           1, 20),
(23, 1, 'ADM-001-002', 'MENU_ITEM', 'Gerir Roles',        '/admin/users/roles',          2, 20),
(24, 1, 'ADM-002-001', 'MENU_ITEM', 'Turmas',             '/admin/academic/classrooms',  1, 21),
(25, 1, 'ADM-002-002', 'MENU_ITEM', 'Disciplinas',        '/admin/academic/subjects',    2, 21),

-- ── GUEST ───────────────────────────────────────────────────
(30, 1, 'GST-001',     'HEADER',    'Início',             '/guest/home',                 1, NULL);

SELECT setval(pg_get_serial_sequence('app_transaction', 'id'), 100);

-- ============================================================
-- 2. ROLE_TRANSACTION — Mapeamento Role → Transação
-- STATUS: 1 = ATIVO | ROLE: valor do enum UserRoles (STRING)
-- ============================================================
INSERT INTO role_transaction (id, status, role, app_transaction_id) VALUES

-- STUDENT
(1,  1, 'STUDENT',   1),
(2,  1, 'STUDENT',   2),
(3,  1, 'STUDENT',   3),
(4,  1, 'STUDENT',   4),
(5,  1, 'STUDENT',   5),
(6,  1, 'STUDENT',   6),

-- PROFESSOR
(10, 1, 'PROFESSOR', 10),
(11, 1, 'PROFESSOR', 11),
(12, 1, 'PROFESSOR', 12),
(13, 1, 'PROFESSOR', 13),
(14, 1, 'PROFESSOR', 14),
(15, 1, 'PROFESSOR', 15),

-- ADMIN
(20, 1, 'ADMIN',     20),
(21, 1, 'ADMIN',     21),
(22, 1, 'ADMIN',     22),
(23, 1, 'ADMIN',     23),
(24, 1, 'ADMIN',     24),
(25, 1, 'ADMIN',     25),

-- GUEST
(30, 1, 'GUEST',     30);

SELECT setval(pg_get_serial_sequence('role_transaction', 'id'), 100);

-- ============================================================
-- 3. SCHOOLS (ac_school)
-- Coincidem com as opções do frontend Register.tsx
-- ============================================================
INSERT INTO ac_school (id, status, created_by, created_date, last_modified_by, last_modified_date, name, city) VALUES
(1, 1, 0, NOW(), 0, NOW(), 'Universidade Eduardo Mondlane',       'Maputo'),
(2, 1, 0, NOW(), 0, NOW(), 'Universidade Politécnica',            'Maputo'),
(3, 1, 0, NOW(), 0, NOW(), 'Universidade Católica de Moçambique', 'Beira');

SELECT setval(pg_get_serial_sequence('ac_school', 'id'), 10);

-- ============================================================
-- 4. CLASS LEVELS (ac_class_level)
-- ============================================================
INSERT INTO ac_class_level (id, status, created_by, created_date, last_modified_by, last_modified_date, name) VALUES
(1, 1, 0, NOW(), 0, NOW(), '1º Ano'),
(2, 1, 0, NOW(), 0, NOW(), '2º Ano'),
(3, 1, 0, NOW(), 0, NOW(), '3º Ano'),
(4, 1, 0, NOW(), 0, NOW(), '4º Ano'),
(5, 1, 0, NOW(), 0, NOW(), '5º Ano');

SELECT setval(pg_get_serial_sequence('ac_class_level', 'id'), 10);

-- ============================================================
-- 5. CLASSROOMS (ac_classroom)
-- FK: school_id → ac_school | class_level_id → ac_class_level
-- ============================================================
INSERT INTO ac_classroom (id, status, created_by, created_date, last_modified_by, last_modified_date, name, school_id, class_level_id, shift) VALUES

-- UEM (school_id = 1)
(1,  1, 0, NOW(), 0, NOW(), 'Turma A - 1º Ano', 1, 1, 'Manhã'),
(2,  1, 0, NOW(), 0, NOW(), 'Turma B - 1º Ano', 1, 1, 'Tarde'),
(3,  1, 0, NOW(), 0, NOW(), 'Turma A - 2º Ano', 1, 2, 'Manhã'),
(4,  1, 0, NOW(), 0, NOW(), 'Turma B - 2º Ano', 1, 2, 'Tarde'),
(5,  1, 0, NOW(), 0, NOW(), 'Turma A - 3º Ano', 1, 3, 'Manhã'),
(6,  1, 0, NOW(), 0, NOW(), 'Turma B - 3º Ano', 1, 3, 'Tarde'),

-- UNIPO (school_id = 2)
(7,  1, 0, NOW(), 0, NOW(), 'Turma A - 1º Ano', 2, 1, 'Manhã'),
(8,  1, 0, NOW(), 0, NOW(), 'Turma A - 2º Ano', 2, 2, 'Manhã'),
(9,  1, 0, NOW(), 0, NOW(), 'Turma A - 3º Ano', 2, 3, 'Tarde'),

-- UCM (school_id = 3)
(10, 1, 0, NOW(), 0, NOW(), 'Turma A - 1º Ano', 3, 1, 'Manhã'),
(11, 1, 0, NOW(), 0, NOW(), 'Turma A - 2º Ano', 3, 2, 'Manhã');

SELECT setval(pg_get_serial_sequence('ac_classroom', 'id'), 20);

-- ============================================================
-- 6. SUBJECTS (ac_subject)
-- ============================================================
INSERT INTO ac_subject (id, status, created_by, created_date, last_modified_by, last_modified_date, name) VALUES
(1,  1, 0, NOW(), 0, NOW(), 'Matemática'),
(2,  1, 0, NOW(), 0, NOW(), 'Português'),
(3,  1, 0, NOW(), 0, NOW(), 'Física'),
(4,  1, 0, NOW(), 0, NOW(), 'Química'),
(5,  1, 0, NOW(), 0, NOW(), 'História'),
(6,  1, 0, NOW(), 0, NOW(), 'Biologia'),
(7,  1, 0, NOW(), 0, NOW(), 'Inglês'),
(8,  1, 0, NOW(), 0, NOW(), 'Informática'),
(9,  1, 0, NOW(), 0, NOW(), 'Programação'),
(10, 1, 0, NOW(), 0, NOW(), 'Economia');

SELECT setval(pg_get_serial_sequence('ac_subject', 'id'), 20);

-- ============================================================
-- 7. UTILIZADOR DE TESTE (DEV ONLY)
-- Login: +258849997777 / prof12345
-- ============================================================
INSERT INTO sae_user (
    status, created_by, created_date, last_modified_by, last_modified_date,
    username, email, password, full_name, enabled, rolet_id
)
SELECT
    0, 0, NOW(), 0, NOW(),
    '+258849997777',
    'prof@sae.test',
    '$2b$10$KKJUhQcHnzzjMs4M.fZDd.US/9swMTv7nU3A9ADQ4RAcMpjI1IQzO',
    'Professor Teste',
    true,
    (SELECT id FROM role_transaction WHERE role = 'PROFESSOR' ORDER BY id LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM sae_user WHERE username = '+258849997777'
);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'app_transaction' AS tabela, COUNT(*) AS total FROM app_transaction
UNION ALL
SELECT 'role_transaction',          COUNT(*) FROM role_transaction
UNION ALL
SELECT 'ac_school',                 COUNT(*) FROM ac_school
UNION ALL
SELECT 'ac_class_level',            COUNT(*) FROM ac_class_level
UNION ALL
SELECT 'ac_classroom',              COUNT(*) FROM ac_classroom
UNION ALL
SELECT 'ac_subject',                COUNT(*) FROM ac_subject
UNION ALL
SELECT 'sae_user',                  COUNT(*) FROM sae_user;
