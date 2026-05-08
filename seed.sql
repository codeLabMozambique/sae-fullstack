-- ============================================================
-- SAE - SEED DE DADOS PARA DESENVOLVIMENTO
-- Base de Dados: sae_db (PostgreSQL 5432)
-- Executar com: psql -U postgres -d sae_db -f seed.sql
-- Seguro para re-execução: ON CONFLICT DO NOTHING em todos os INSERTs
-- ============================================================
-- Ordem obrigatória (FKs):
--   app_transaction → role_transaction
--   ac_school → ac_class_level → ac_classroom
--   ac_subject (independente)
--   role_transaction → sae_user
-- ============================================================

-- ============================================================
-- 0. CRIAR TABELAS (caso não existam)
--    As tabelas JPA (ac_*, sae_user, etc.) são normalmente
--    criadas pelo Hibernate ao arrancar a aplicação.
--    Definimo-las aqui para que o seed possa correr de forma
--    autónoma, antes ou depois de iniciar o Spring Boot.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_transaction (
    ID          BIGSERIAL PRIMARY KEY,
    STATUS      SMALLINT     NOT NULL DEFAULT 1,
    CODE        VARCHAR(64)  NOT NULL UNIQUE,
    TYPE        VARCHAR(64)  NOT NULL,
    LABEL       VARCHAR(256) NOT NULL,
    ROUTER_LINK VARCHAR(256),
    POSITION    BIGINT       NOT NULL,
    PARENT_ID   BIGINT REFERENCES app_transaction(ID)
);

CREATE TABLE IF NOT EXISTS role_transaction (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT    NOT NULL DEFAULT 1,
    ROLE               VARCHAR(64) NOT NULL,
    APP_TRANSACTION_ID BIGINT REFERENCES app_transaction(ID)
);

CREATE TABLE IF NOT EXISTS ac_school (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT DEFAULT 1,
    CREATED_BY         BIGINT,
    CREATED_DATE       TIMESTAMP,
    LAST_MODIFIED_BY   BIGINT,
    LAST_MODIFIED_DATE TIMESTAMP,
    NAME               VARCHAR(255) NOT NULL,
    CITY               VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ac_class_level (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT DEFAULT 1,
    CREATED_BY         BIGINT,
    CREATED_DATE       TIMESTAMP,
    LAST_MODIFIED_BY   BIGINT,
    LAST_MODIFIED_DATE TIMESTAMP,
    NAME               VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ac_classroom (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT DEFAULT 1,
    CREATED_BY         BIGINT,
    CREATED_DATE       TIMESTAMP,
    LAST_MODIFIED_BY   BIGINT,
    LAST_MODIFIED_DATE TIMESTAMP,
    NAME               VARCHAR(255) NOT NULL,
    SCHOOL_ID          BIGINT REFERENCES ac_school(ID),
    CLASS_LEVEL_ID     BIGINT REFERENCES ac_class_level(ID),
    SHIFT              VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ac_subject (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT DEFAULT 1,
    CREATED_BY         BIGINT,
    CREATED_DATE       TIMESTAMP,
    LAST_MODIFIED_BY   BIGINT,
    LAST_MODIFIED_DATE TIMESTAMP,
    NAME               VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS sae_user (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT DEFAULT 1,
    CREATED_BY         BIGINT,
    CREATED_DATE       TIMESTAMP,
    LAST_MODIFIED_BY   BIGINT,
    LAST_MODIFIED_DATE TIMESTAMP,
    USERNAME           VARCHAR(255) NOT NULL UNIQUE,
    EMAIL              VARCHAR(255) UNIQUE,
    PASSWORD           VARCHAR(255) NOT NULL,
    FULL_NAME          VARCHAR(255),
    ENABLED            BOOLEAN DEFAULT TRUE,
    ROLET_ID           BIGINT REFERENCES role_transaction(ID)
);

CREATE TABLE IF NOT EXISTS professor_profile (
    ID                    BIGSERIAL PRIMARY KEY,
    STATUS                SMALLINT DEFAULT 1,
    CREATED_BY            BIGINT,
    CREATED_DATE          TIMESTAMP,
    LAST_MODIFIED_BY      BIGINT,
    LAST_MODIFIED_DATE    TIMESTAMP,
    USER_ID               BIGINT REFERENCES sae_user(ID),
    SCHOOL_ID             BIGINT,
    DEPARTMENT            VARCHAR(255),
    SPECIALIZATION        VARCHAR(255),
    INSTITUTIONAL_CONTACT VARCHAR(255),
    IS_ONLINE             BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS student_profile (
    ID                 BIGSERIAL PRIMARY KEY,
    STATUS             SMALLINT DEFAULT 1,
    CREATED_BY         BIGINT,
    CREATED_DATE       TIMESTAMP,
    LAST_MODIFIED_BY   BIGINT,
    LAST_MODIFIED_DATE TIMESTAMP,
    USER_ID            BIGINT REFERENCES sae_user(ID),
    SCHOOL_ID          BIGINT,
    CLASSROOM_ID       BIGINT,
    GRADE              VARCHAR(255),
    AGE                INTEGER,
    ENROLLMENT_DATE    DATE
);

-- ============================================================
-- 1. APP_TRANSACTION — Estrutura de Menus por Role
-- STATUS: 1 = ATIVO | TYPE: 'HEADER' ou 'MENU_ITEM'
-- ============================================================

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
(20, 1, 'ADM-001',     'HEADER',    'Utilizadores',            '/admin/users',                           1, NULL),
(21, 1, 'ADM-002',     'HEADER',    'Académico',               '/admin/academic',                        2, NULL),
(22, 1, 'ADM-001-001', 'MENU_ITEM', 'Listar Utilizadores',     '/admin/users/list',                      1, 20),
(23, 1, 'ADM-001-002', 'MENU_ITEM', 'Gerir Roles',             '/admin/users/roles',                     2, 20),
(24, 1, 'ADM-002-001', 'MENU_ITEM', 'Turmas',                  '/admin/academic/classrooms',             1, 21),
(25, 1, 'ADM-002-002', 'MENU_ITEM', 'Disciplinas',             '/admin/academic/subjects',               2, 21),
(26, 1, 'ADM-002-003', 'MENU_ITEM', 'Escolas',                 '/admin/academic/schools',                3, 21),
(27, 1, 'ADM-002-004', 'MENU_ITEM', 'Níveis de Ensino',        '/admin/academic/class-levels',           4, 21),
(28, 1, 'ADM-002-005', 'MENU_ITEM', 'Atribuições Professores', '/admin/academic/professor-assignments',  5, 21),

-- ── GUEST ───────────────────────────────────────────────────
(30, 1, 'GST-001',     'HEADER',    'Início',             '/guest/home',                 1, NULL)

ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('app_transaction', 'id'), 100);

-- ============================================================
-- 2. ROLE_TRANSACTION — Mapeamento Role → Transação
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
(26, 1, 'ADMIN',     26),
(27, 1, 'ADMIN',     27),
(28, 1, 'ADMIN',     28),

-- GUEST
(30, 1, 'GUEST',     30)

ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('role_transaction', 'id'), 100);

-- ============================================================
-- 3. SCHOOLS (ac_school)
-- ============================================================

INSERT INTO ac_school (id, status, created_by, created_date, last_modified_by, last_modified_date, name, city) VALUES
(1, 1, 0, NOW(), 0, NOW(), 'Universidade Eduardo Mondlane',       'Maputo'),
(2, 1, 0, NOW(), 0, NOW(), 'Universidade Politécnica',            'Maputo'),
(3, 1, 0, NOW(), 0, NOW(), 'Universidade Católica de Moçambique', 'Beira')

ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_school', 'id'), 10);

-- ============================================================
-- 4. CLASS LEVELS (ac_class_level)
-- ============================================================

INSERT INTO ac_class_level (id, status, created_by, created_date, last_modified_by, last_modified_date, name) VALUES
(1, 1, 0, NOW(), 0, NOW(), '1º Ano'),
(2, 1, 0, NOW(), 0, NOW(), '2º Ano'),
(3, 1, 0, NOW(), 0, NOW(), '3º Ano'),
(4, 1, 0, NOW(), 0, NOW(), '4º Ano'),
(5, 1, 0, NOW(), 0, NOW(), '5º Ano')

ON CONFLICT (id) DO NOTHING;

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
(11, 1, 0, NOW(), 0, NOW(), 'Turma A - 2º Ano', 3, 2, 'Manhã')

ON CONFLICT (id) DO NOTHING;

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
(10, 1, 0, NOW(), 0, NOW(), 'Economia')

ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_subject', 'id'), 20);

-- ============================================================
-- 7. UTILIZADOR DE TESTE (DEV ONLY)
-- Login: +258849997777 / prof12345
-- Usa SELECT WHERE NOT EXISTS — seguro para re-execução
-- ============================================================

INSERT INTO sae_user (
    status, created_by, created_date, last_modified_by, last_modified_date,
    username, email, password, full_name, enabled, rolet_id
)
SELECT
    1, 0, NOW(), 0, NOW(),
    '+258849997777',
    'prof@sae.test',
    '$2a$10$KKJUhQcHnzzjMs4M.fZDd.US/9swMTv7nU3A9ADQ4RAcMpjI1IQzO',
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


-- ============================================================
-- ============================================================
-- EXTENSÃO: BIBLIOTECA / CONTENT-SERVICE
-- Adiciona tudo o que falta para o content-service ligar
-- ao frontend de ponta-a-ponta:
--   • menus (app_transaction)
--   • mapeamentos role→menu (role_transaction)
--   • disciplinas (tabela JPA do content-service)
--   • content_logs (auditoria)
--   • utilizadores de teste (Aluno + Admin)
--   • perfis de student/professor
--
-- IDs 40+ para menus/roles para evitar colisão com a secção
-- original (1-30).
-- ============================================================
-- ============================================================

-- ============================================================
-- 8. APP_TRANSACTION — Menus de Biblioteca (CONTENT-SERVICE)
-- ============================================================

INSERT INTO app_transaction (id, status, code, type, label, router_link, position, parent_id) VALUES

-- ── STUDENT — Biblioteca + Metas ────────────────────────────
(40, 1, 'STD-LIB',       'HEADER',    'Biblioteca',         '/student/library',              3, NULL),
(41, 1, 'STD-LIB-001',   'MENU_ITEM', 'Pesquisar',          '/student/library',              1, 40),
(42, 1, 'STD-LIB-002',   'MENU_ITEM', 'Categorias',         '/student/library/categories',   2, 40),
(43, 1, 'STD-LIB-003',   'MENU_ITEM', 'Favoritos',          '/student/library/favorites',    3, 40),
(44, 1, 'STD-LIB-004',   'MENU_ITEM', 'Continuar a Ler',    '/student/library/progress',     4, 40),
(45, 1, 'STD-LIB-005',   'MENU_ITEM', 'Histórico',          '/student/library/history',      5, 40),
(46, 1, 'STD-GOALS',     'HEADER',    'Metas de Estudo',    '/student/goals',                4, NULL),
(47, 1, 'STD-GOALS-001', 'MENU_ITEM', 'Minhas Metas',       '/student/goals',                1, 46),
(48, 1, 'STD-GOALS-002', 'MENU_ITEM', 'Nova Meta',          '/student/goals/new',            2, 46),

-- ── PROFESSOR — Biblioteca + Upload + Metas ─────────────────
(50, 1, 'PRF-LIB',       'HEADER',    'Biblioteca',         '/professor/library',                3, NULL),
(51, 1, 'PRF-LIB-001',   'MENU_ITEM', 'Pesquisar',          '/professor/library',                1, 50),
(52, 1, 'PRF-LIB-002',   'MENU_ITEM', 'Os Meus Conteúdos',  '/professor/library/my-content',     2, 50),
(53, 1, 'PRF-LIB-003',   'MENU_ITEM', 'Carregar Novo',      '/professor/library/upload',         3, 50),
(54, 1, 'PRF-LIB-004',   'MENU_ITEM', 'Categorias',         '/professor/library/categories',     4, 50),
(55, 1, 'PRF-LIB-005',   'MENU_ITEM', 'Favoritos',          '/professor/library/favorites',      5, 50),
(56, 1, 'PRF-LIB-006',   'MENU_ITEM', 'Continuar a Ler',    '/professor/library/progress',       6, 50),
(57, 1, 'PRF-LIB-007',   'MENU_ITEM', 'Histórico',          '/professor/library/history',        7, 50),
(58, 1, 'PRF-GOALS',     'HEADER',    'Metas de Estudo',    '/professor/goals',                  4, NULL),
(59, 1, 'PRF-GOALS-001', 'MENU_ITEM', 'Minhas Metas',       '/professor/goals',                  1, 58),

-- ── ADMIN — Gestão Completa da Biblioteca ───────────────────
(60, 1, 'ADM-LIB',       'HEADER',    'Biblioteca',           '/admin/library',                   3, NULL),
(61, 1, 'ADM-LIB-001',   'MENU_ITEM', 'Conteúdos',            '/admin/library/contents',          1, 60),
(62, 1, 'ADM-LIB-002',   'MENU_ITEM', 'Carregar Novo',        '/admin/library/upload',            2, 60),
(63, 1, 'ADM-LIB-003',   'MENU_ITEM', 'Carregar em Lote',     '/admin/library/batch',             3, 60),
(64, 1, 'ADM-LIB-004',   'MENU_ITEM', 'Categorias',           '/admin/library/categories',        4, 60),
(65, 1, 'ADM-LIB-005',   'MENU_ITEM', 'Disciplinas',          '/admin/library/disciplines',       5, 60),
(66, 1, 'ADM-LIB-006',   'MENU_ITEM', 'Logs de Auditoria',    '/admin/library/logs',              6, 60),

-- ── OFFLINE — disponível em todas as roles ───────────────────
(70, 1, 'STD-LIB-006',   'MENU_ITEM', 'Leitura Offline',      '/student/library/offline',         6, 40),
(71, 1, 'PRF-LIB-008',   'MENU_ITEM', 'Leitura Offline',      '/professor/library/offline',       8, 50),
(72, 1, 'ADM-LIB-007',   'MENU_ITEM', 'Leitura Offline',      '/admin/library/offline',           7, 60)

-- DO UPDATE (não DO NOTHING) garante que execuções futuras corrigem discrepâncias
-- de versões anteriores deste seed (ex.: parent_id que mudou).
ON CONFLICT (id) DO UPDATE SET
    status      = EXCLUDED.status,
    code        = EXCLUDED.code,
    type        = EXCLUDED.type,
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

SELECT setval(pg_get_serial_sequence('app_transaction', 'id'), 200);

-- ============================================================
-- 9. ROLE_TRANSACTION — Mapeamento dos novos menus
-- ============================================================

INSERT INTO role_transaction (id, status, role, app_transaction_id) VALUES

-- STUDENT
(40, 1, 'STUDENT',   40),
(41, 1, 'STUDENT',   41),
(42, 1, 'STUDENT',   42),
(43, 1, 'STUDENT',   43),
(44, 1, 'STUDENT',   44),
(45, 1, 'STUDENT',   45),
(46, 1, 'STUDENT',   46),
(47, 1, 'STUDENT',   47),
(48, 1, 'STUDENT',   48),

-- PROFESSOR
(50, 1, 'PROFESSOR', 50),
(51, 1, 'PROFESSOR', 51),
(52, 1, 'PROFESSOR', 52),
(53, 1, 'PROFESSOR', 53),
(54, 1, 'PROFESSOR', 54),
(55, 1, 'PROFESSOR', 55),
(56, 1, 'PROFESSOR', 56),
(57, 1, 'PROFESSOR', 57),
(58, 1, 'PROFESSOR', 58),
(59, 1, 'PROFESSOR', 59),

-- ADMIN
(60, 1, 'ADMIN',     60),
(61, 1, 'ADMIN',     61),
(62, 1, 'ADMIN',     62),
(63, 1, 'ADMIN',     63),
(64, 1, 'ADMIN',     64),
(65, 1, 'ADMIN',     65),
(66, 1, 'ADMIN',     66),

-- Leitura Offline (item por role)
(70, 1, 'STUDENT',   70),
(71, 1, 'PROFESSOR', 71),
(72, 1, 'ADMIN',     72)

ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('role_transaction', 'id'), 200);

-- ============================================================
-- 10. DISCIPLINES — Tabela do CONTENT-SERVICE (JPA)
-- O Hibernate cria-a ao iniciar o content-service.
-- Pré-criamos aqui para que o seed seja autónomo.
-- ============================================================

CREATE TABLE IF NOT EXISTS disciplines (
    ID         BIGSERIAL PRIMARY KEY,
    NAME       VARCHAR(255) NOT NULL UNIQUE,
    CREATED_AT TIMESTAMP
);

INSERT INTO disciplines (id, name, created_at) VALUES
(1,  'Matemática',  NOW()),
(2,  'Português',   NOW()),
(3,  'Física',      NOW()),
(4,  'Química',     NOW()),
(5,  'História',    NOW()),
(6,  'Biologia',    NOW()),
(7,  'Inglês',      NOW()),
(8,  'Informática', NOW()),
(9,  'Programação', NOW()),
(10, 'Economia',    NOW())

ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('disciplines', 'id'), 20);

-- ============================================================
-- 11. CONTENT_LOGS — Auditoria de uploads/deletes (CONTENT-SERVICE)
-- Tabela criada pelo Hibernate ao iniciar; pré-criamos aqui.
-- ============================================================

CREATE TABLE IF NOT EXISTS content_logs (
    ID            BIGSERIAL PRIMARY KEY,
    CONTENT_ID    VARCHAR(255) NOT NULL,
    ACTION        VARCHAR(255) NOT NULL,
    USER_USERNAME VARCHAR(255) NOT NULL,
    USER_ROLE     VARCHAR(255),
    TIMESTAMP     TIMESTAMP
);

-- ============================================================
-- 12. UTILIZADORES DE TESTE (DEV ONLY)
-- Todos com password 'prof12345' (mesma hash BCrypt do user existente).
-- Usa SELECT WHERE NOT EXISTS — seguro para re-execução.
-- ============================================================

-- 12.1 ALUNO ──────────────────────────────────────────────────
-- Login: +258841111101 / prof12345
INSERT INTO sae_user (
    status, created_by, created_date, last_modified_by, last_modified_date,
    username, email, password, full_name, enabled, rolet_id
)
SELECT
    1, 0, NOW(), 0, NOW(),
    '+258841111101',
    'aluno1@sae.test',
    '$2a$10$KKJUhQcHnzzjMs4M.fZDd.US/9swMTv7nU3A9ADQ4RAcMpjI1IQzO',
    'Ana Maria Silva',
    true,
    (SELECT id FROM role_transaction WHERE role = 'STUDENT' ORDER BY id LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM sae_user WHERE username = '+258841111101'
);

-- 12.2 ADMIN ─────────────────────────────────────────────────
-- Login: +258849998888 / prof12345
INSERT INTO sae_user (
    status, created_by, created_date, last_modified_by, last_modified_date,
    username, email, password, full_name, enabled, rolet_id
)
SELECT
    1, 0, NOW(), 0, NOW(),
    '+258849998888',
    'admin@sae.test',
    '$2a$10$KKJUhQcHnzzjMs4M.fZDd.US/9swMTv7nU3A9ADQ4RAcMpjI1IQzO',
    'Administrador Sistema',
    true,
    (SELECT id FROM role_transaction WHERE role = 'ADMIN' ORDER BY id LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM sae_user WHERE username = '+258849998888'
);

-- 12.3 STUDENT_PROFILE para o aluno seedado
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, age, enrollment_date
)
SELECT 1, 0, NOW(), 0, NOW(),
    (SELECT id FROM sae_user WHERE username = '+258841111101'),
    1, 1, '1º Ano', 18, CURRENT_DATE
WHERE EXISTS (SELECT 1 FROM sae_user WHERE username = '+258841111101')
  AND NOT EXISTS (
      SELECT 1 FROM student_profile
      WHERE user_id = (SELECT id FROM sae_user WHERE username = '+258841111101')
  );

-- 12.4 PROFESSOR_PROFILE para o professor existente (+258849997777)
INSERT INTO professor_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, department, specialization, institutional_contact, is_online
)
SELECT 1, 0, NOW(), 0, NOW(),
    (SELECT id FROM sae_user WHERE username = '+258849997777'),
    1, 'Ciências Exactas', 'Matemática', 'prof@sae.test', false
WHERE EXISTS (SELECT 1 FROM sae_user WHERE username = '+258849997777')
  AND NOT EXISTS (
      SELECT 1 FROM professor_profile
      WHERE user_id = (SELECT id FROM sae_user WHERE username = '+258849997777')
  );

-- ============================================================
-- 13. VERIFICAÇÃO FINAL EXPANDIDA (Auth + Content-Service)
-- ============================================================
SELECT 'app_transaction'   AS tabela, COUNT(*) AS total FROM app_transaction
UNION ALL SELECT 'role_transaction',  COUNT(*) FROM role_transaction
UNION ALL SELECT 'ac_school',         COUNT(*) FROM ac_school
UNION ALL SELECT 'ac_class_level',    COUNT(*) FROM ac_class_level
UNION ALL SELECT 'ac_classroom',      COUNT(*) FROM ac_classroom
UNION ALL SELECT 'ac_subject',        COUNT(*) FROM ac_subject
UNION ALL SELECT 'sae_user',          COUNT(*) FROM sae_user
UNION ALL SELECT 'student_profile',   COUNT(*) FROM student_profile
UNION ALL SELECT 'professor_profile', COUNT(*) FROM professor_profile
UNION ALL SELECT 'disciplines',       COUNT(*) FROM disciplines
UNION ALL SELECT 'content_logs',      COUNT(*) FROM content_logs;

-- ============================================================
-- FIM DO SEED PostgreSQL
--
-- ⚠️  MongoDB também precisa de seed (categorias da biblioteca).
--    Ver ficheiro: mongo-seed.js
--    Correr com:
--      docker exec -i sae-mongodb mongosh sae_content < mongo-seed.js
--
-- ⚠️  CONTEÚDOS (PDFs) requerem ficheiros reais no MinIO. Não são
--    seedados via SQL/JSON — fazer upload via:
--      POST /api/professor/contents  ou  POST /api/admin/contents
-- ============================================================
