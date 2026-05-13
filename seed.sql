-- =============================================================================
-- SAE — SEED DE ROTAS DO SISTEMA
-- Base de Dados: sae_db (PostgreSQL)
-- Executar com: psql -U postgres -d sae_db -f seed.sql
-- Seguro para re-execução: ON CONFLICT (code) DO UPDATE — nunca duplica rotas
-- =============================================================================
-- ESTRATÉGIA:
--   • Sem IDs hardcoded — a sequência gere os IDs automaticamente
--   • parent_id resolvido por subquery de code (não por número fixo)
--   • role_transaction usa constraint única em (role, app_transaction_id)
--   • Pode ser executado várias vezes em qualquer estado da BD
-- =============================================================================

-- =============================================================================
-- TABELAS (criadas pelo Hibernate; definidas aqui para execução autónoma)
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_transaction (
    id          BIGSERIAL    PRIMARY KEY,
    status      SMALLINT     NOT NULL DEFAULT 1,
    code        VARCHAR(64)  NOT NULL UNIQUE,
    type        VARCHAR(64)  NOT NULL,
    label       VARCHAR(256) NOT NULL,
    router_link VARCHAR(256),
    position    BIGINT       NOT NULL,
    parent_id   BIGINT       REFERENCES app_transaction(id)
);

CREATE TABLE IF NOT EXISTS role_transaction (
    id                 BIGSERIAL   PRIMARY KEY,
    status             SMALLINT    NOT NULL DEFAULT 1,
    role               VARCHAR(64) NOT NULL,
    app_transaction_id BIGINT      REFERENCES app_transaction(id)
);

-- Sincroniza as sequências com o MAX(id) actual (evita conflito de PK em re-execuções)
SELECT setval('app_transaction_id_seq',
    GREATEST(COALESCE((SELECT MAX(id) FROM app_transaction), 1), 1), true);
SELECT setval('role_transaction_id_seq',
    GREATEST(COALESCE((SELECT MAX(id) FROM role_transaction), 1), 1), true);

-- Constraint de roles
ALTER TABLE role_transaction DROP CONSTRAINT IF EXISTS role_transaction_role_check;
ALTER TABLE role_transaction ADD CONSTRAINT role_transaction_role_check
    CHECK (role IN ('ROOT', 'ADMIN', 'SCHOOL_ADMIN', 'PROFESSOR', 'STUDENT', 'GUEST'));

-- Constraint única para idempotência do mapeamento role → menu
-- Remove duplicados antes de criar o índice único (seguro em re-execuções)
DELETE FROM role_transaction
WHERE id NOT IN (
    SELECT MIN(id)
    FROM role_transaction
    GROUP BY role, app_transaction_id
);

ALTER TABLE role_transaction DROP CONSTRAINT IF EXISTS uq_role_transaction_role_menu;
ALTER TABLE role_transaction ADD CONSTRAINT uq_role_transaction_role_menu
    UNIQUE (role, app_transaction_id);

-- =============================================================================
-- PASSO 1 — HEADERS (sem parent_id)
-- Inseridos primeiro para que os MENU_ITEMs os possam referenciar
-- =============================================================================

INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id) VALUES
-- ROOT
(1, 'ROOT-000',   'HEADER', 'Sistema',           NULL,                     1, NULL),
-- ADMIN
(1, 'ADM-001',    'HEADER', 'Utilizadores',       '/admin/users',           1, NULL),
(1, 'ADM-002',    'HEADER', 'Académico',           '/admin/academic',        2, NULL),
-- SCHOOL_ADMIN
(1, 'SADM-000',   'HEADER', 'Dashboard',          '/school-admin/dashboard',1, NULL),
-- PROFESSOR
(1, 'PRF-001',    'HEADER', 'Dashboard',          '/professor/dashboard',   1, NULL),
(1, 'PRF-002',    'HEADER', 'Fórum',              '/professor/forum',       2, NULL),
(1, 'PRF-LIB',   'HEADER', 'Biblioteca',         '/professor/library',     3, NULL),
(1, 'PRF-GOALS', 'HEADER', 'Metas de Estudo',    '/professor/goals',       4, NULL),
(1, 'PRF-QUIZ',  'HEADER', 'Quizzes',            '/professor/quiz',        5, NULL),
(1, 'PRF-ASG',   'HEADER', 'Tarefas',            '/professor/assignments', 6, NULL),
-- STUDENT
(1, 'STD-001',   'HEADER', 'Dashboard',          '/student/dashboard',     1, NULL),
(1, 'STD-002',   'HEADER', 'Fórum',              '/student/forum',         2, NULL),
(1, 'STD-LIB',   'HEADER', 'Biblioteca',         '/student/library',       3, NULL),
(1, 'STD-GOALS', 'HEADER', 'Metas de Estudo',    '/student/goals',         4, NULL),
(1, 'STD-QUIZ',  'HEADER', 'Preparação Exame',   '/student/quiz',          5, NULL),
(1, 'STD-ASG',   'HEADER', 'Tarefas',            '/student/assignments',   6, NULL),
-- ADMIN — Biblioteca + Quiz
(1, 'ADM-LIB',   'HEADER', 'Biblioteca',         '/admin/library',         3, NULL),
(1, 'ADM-QUIZ',  'HEADER', 'Quizzes',            '/admin/quiz',            4, NULL),
-- GUEST
(1, 'GST-001',   'HEADER', 'Biblioteca',         '/biblioteca',            1, NULL)

ON CONFLICT (code) DO UPDATE SET
    status      = EXCLUDED.status,
    type        = EXCLUDED.type,
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

-- =============================================================================
-- PASSO 2 — MENU_ITEMs com parent_id resolvido por subquery de code
-- =============================================================================

INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id)
SELECT v.status, v.code, v.type, v.label, v.router_link, v.position,
       (SELECT id FROM app_transaction WHERE code = v.parent_code)
FROM (VALUES
    -- ROOT
    (1,'ROOT-000-001','MENU_ITEM','Configurações de Rede', '/root/settings',                        1,'ROOT-000'),
    (1,'ROOT-000-002','MENU_ITEM','Gestão de Admins',      '/root/admins',                          2,'ROOT-000'),
    -- ADMIN Utilizadores
    (1,'ADM-001-001', 'MENU_ITEM','Listar Utilizadores',   '/admin/users/list',                     1,'ADM-001'),
    (1,'ADM-001-002', 'MENU_ITEM','Gerir Roles',           '/admin/users/roles',                    2,'ADM-001'),
    -- ADMIN Académico
    (1,'ADM-002-001', 'MENU_ITEM','Turmas',                '/admin/academic/classrooms',            1,'ADM-002'),
    (1,'ADM-002-002', 'MENU_ITEM','Disciplinas',           '/admin/academic/subjects',              2,'ADM-002'),
    (1,'ADM-002-003', 'MENU_ITEM','Escolas',               '/admin/academic/schools',               3,'ADM-002'),
    (1,'ADM-002-004', 'MENU_ITEM','Níveis de Ensino',      '/admin/academic/class-levels',          4,'ADM-002'),
    (1,'ADM-002-005', 'MENU_ITEM','Atribuições Professores','/admin/academic/professor-assignments',5,'ADM-002'),
    -- SCHOOL_ADMIN
    (1,'SADM-000-001','MENU_ITEM','Visão Geral',           '/school-admin/dashboard',               1,'SADM-000'),
    (1,'SADM-000-002','MENU_ITEM','Estatísticas',          '/school-admin/dashboard/stats',         2,'SADM-000'),
    -- PROFESSOR Dashboard
    (1,'PRF-001-001', 'MENU_ITEM','Minhas Turmas',         '/professor/classes',                    1,'PRF-001'),
    (1,'PRF-001-002', 'MENU_ITEM','Gestão de Notas',       '/professor/grades',                     2,'PRF-001'),
    -- PROFESSOR Fórum
    (1,'PRF-002-001', 'MENU_ITEM','Perguntas Pendentes',   '/professor/forum/pending',              1,'PRF-002'),
    (1,'PRF-002-002', 'MENU_ITEM','Respondidas',           '/professor/forum/answered',             2,'PRF-002'),
    -- PROFESSOR Biblioteca
    (1,'PRF-LIB-001', 'MENU_ITEM','Pesquisar',             '/professor/library',                    1,'PRF-LIB'),
    (1,'PRF-LIB-002', 'MENU_ITEM','Os Meus Conteúdos',    '/professor/library/my-content',         2,'PRF-LIB'),
    (1,'PRF-LIB-003', 'MENU_ITEM','Categorias',            '/professor/library/categories',         3,'PRF-LIB'),
    (1,'PRF-LIB-004', 'MENU_ITEM','Favoritos',             '/professor/library/favorites',          4,'PRF-LIB'),
    (1,'PRF-LIB-005', 'MENU_ITEM','Continuar a Ler',       '/professor/library/progress',           5,'PRF-LIB'),
    (1,'PRF-LIB-006', 'MENU_ITEM','Histórico',             '/professor/library/history',            6,'PRF-LIB'),
    (1,'PRF-LIB-007', 'MENU_ITEM','Leitura Offline',       '/professor/library/offline',            7,'PRF-LIB'),
    -- PROFESSOR Metas
    (1,'PRF-GOALS-001','MENU_ITEM','Minhas Metas',         '/professor/goals',                      1,'PRF-GOALS'),
    -- PROFESSOR Quiz
    (1,'PRF-QUIZ-001','MENU_ITEM','Gerir Quizzes',         '/professor/quiz/manage',                1,'PRF-QUIZ'),
    (1,'PRF-QUIZ-002','MENU_ITEM','Criar Quiz',            '/professor/quiz/create',                2,'PRF-QUIZ'),
    -- PROFESSOR Tarefas
    (1,'PRF-ASG-001', 'MENU_ITEM','Gerir Tarefas',         '/professor/assignments',                1,'PRF-ASG'),
    -- STUDENT Dashboard
    (1,'STD-001-001', 'MENU_ITEM','Minhas Aulas',          '/student/classes',                      1,'STD-001'),
    (1,'STD-001-002', 'MENU_ITEM','Notas',                 '/student/grades',                       2,'STD-001'),
    -- STUDENT Fórum
    (1,'STD-002-001', 'MENU_ITEM','Minhas Perguntas',      '/student/forum/questions',              1,'STD-002'),
    (1,'STD-002-002', 'MENU_ITEM','Nova Pergunta',         '/student/forum/new',                    2,'STD-002'),
    -- STUDENT Biblioteca
    (1,'STD-LIB-001', 'MENU_ITEM','Pesquisar',             '/student/library',                      1,'STD-LIB'),
    (1,'STD-LIB-002', 'MENU_ITEM','Categorias',            '/student/library/categories',           2,'STD-LIB'),
    (1,'STD-LIB-003', 'MENU_ITEM','Favoritos',             '/student/library/favorites',            3,'STD-LIB'),
    (1,'STD-LIB-004', 'MENU_ITEM','Continuar a Ler',       '/student/library/progress',             4,'STD-LIB'),
    (1,'STD-LIB-005', 'MENU_ITEM','Histórico',             '/student/library/history',              5,'STD-LIB'),
    (1,'STD-LIB-006', 'MENU_ITEM','Leitura Offline',       '/student/library/offline',              6,'STD-LIB'),
    -- STUDENT Metas
    (1,'STD-GOALS-001','MENU_ITEM','Minhas Metas',         '/student/goals',                        1,'STD-GOALS'),
    (1,'STD-GOALS-002','MENU_ITEM','Nova Meta',            '/student/goals/new',                    2,'STD-GOALS'),
    -- STUDENT Quiz
    (1,'STD-QUIZ-001','MENU_ITEM','Escolher Quiz',         '/student/quiz',                         1,'STD-QUIZ'),
    (1,'STD-QUIZ-002','MENU_ITEM','Os Meus Resultados',    '/student/quiz/results',                 2,'STD-QUIZ'),
    -- STUDENT Tarefas
    (1,'STD-ASG-001', 'MENU_ITEM','Minhas Tarefas',        '/student/assignments',                  1,'STD-ASG'),
    (1,'STD-ASG-002', 'MENU_ITEM','Histórico Entregas',    '/student/submissions',                  2,'STD-ASG'),
    -- ADMIN Biblioteca
    (1,'ADM-LIB-001', 'MENU_ITEM','Conteúdos',             '/admin/library/contents',               1,'ADM-LIB'),
    (1,'ADM-LIB-002', 'MENU_ITEM','Carregar Novo',         '/admin/library/upload',                 2,'ADM-LIB'),
    (1,'ADM-LIB-003', 'MENU_ITEM','Carregar em Lote',      '/admin/library/batch',                  3,'ADM-LIB'),
    (1,'ADM-LIB-004', 'MENU_ITEM','Categorias',            '/admin/library/categories',             4,'ADM-LIB'),
    (1,'ADM-LIB-005', 'MENU_ITEM','Disciplinas',           '/admin/library/disciplines',            5,'ADM-LIB'),
    (1,'ADM-LIB-006', 'MENU_ITEM','Logs de Auditoria',     '/admin/library/logs',                   6,'ADM-LIB'),
    (1,'ADM-LIB-007', 'MENU_ITEM','Leitura Offline',       '/admin/library/offline',                7,'ADM-LIB'),
    -- ADMIN Quiz
    (1,'ADM-QUIZ-001','MENU_ITEM','Gerir Quizzes',         '/admin/quiz/manage',                    1,'ADM-QUIZ'),
    (1,'ADM-QUIZ-002','MENU_ITEM','Criar Quiz',            '/admin/quiz/create',                    2,'ADM-QUIZ'),
    -- GUEST Biblioteca pública
    (1,'GST-LIB-001', 'MENU_ITEM','Pesquisar',             '/biblioteca',                           1,'GST-001'),
    (1,'GST-LIB-002', 'MENU_ITEM','Categorias',            '/biblioteca/categorias',                2,'GST-001'),
    (1,'GST-LIB-003', 'MENU_ITEM','Chat IA',               '/biblioteca/chat',                      3,'GST-001')

) AS v(status, code, type, label, router_link, position, parent_code)

ON CONFLICT (code) DO UPDATE SET
    status      = EXCLUDED.status,
    type        = EXCLUDED.type,
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

-- =============================================================================
-- PASSO 3 — ROLE_TRANSACTION
-- Resolução por code; ON CONFLICT (role, app_transaction_id) DO NOTHING
-- =============================================================================

INSERT INTO role_transaction (status, role, app_transaction_id)
SELECT 1, v.role, a.id
FROM (VALUES
    -- ROOT
    ('ROOT','ROOT-000'),
    ('ROOT','ROOT-000-001'),
    ('ROOT','ROOT-000-002'),

    -- ADMIN — gestão
    ('ADMIN','ADM-001'),    ('ADMIN','ADM-001-001'), ('ADMIN','ADM-001-002'),
    ('ADMIN','ADM-002'),    ('ADMIN','ADM-002-001'), ('ADMIN','ADM-002-002'),
    ('ADMIN','ADM-002-003'),('ADMIN','ADM-002-004'), ('ADMIN','ADM-002-005'),
    -- ADMIN — biblioteca
    ('ADMIN','ADM-LIB'),    ('ADMIN','ADM-LIB-001'), ('ADMIN','ADM-LIB-002'),
    ('ADMIN','ADM-LIB-003'),('ADMIN','ADM-LIB-004'), ('ADMIN','ADM-LIB-005'),
    ('ADMIN','ADM-LIB-006'),('ADMIN','ADM-LIB-007'),
    -- ADMIN — quiz
    ('ADMIN','ADM-QUIZ'),   ('ADMIN','ADM-QUIZ-001'),('ADMIN','ADM-QUIZ-002'),

    -- SCHOOL_ADMIN — dashboard próprio
    ('SCHOOL_ADMIN','SADM-000'),    ('SCHOOL_ADMIN','SADM-000-001'),('SCHOOL_ADMIN','SADM-000-002'),
    -- SCHOOL_ADMIN — gestão partilhada (sem Escolas e Níveis)
    ('SCHOOL_ADMIN','ADM-001'),     ('SCHOOL_ADMIN','ADM-001-001'), ('SCHOOL_ADMIN','ADM-001-002'),
    ('SCHOOL_ADMIN','ADM-002'),     ('SCHOOL_ADMIN','ADM-002-001'), ('SCHOOL_ADMIN','ADM-002-002'),
    ('SCHOOL_ADMIN','ADM-002-005'),
    -- SCHOOL_ADMIN — biblioteca + quiz
    ('SCHOOL_ADMIN','ADM-LIB'),     ('SCHOOL_ADMIN','ADM-LIB-001'),('SCHOOL_ADMIN','ADM-LIB-002'),
    ('SCHOOL_ADMIN','ADM-LIB-003'),('SCHOOL_ADMIN','ADM-LIB-004'),('SCHOOL_ADMIN','ADM-LIB-005'),
    ('SCHOOL_ADMIN','ADM-LIB-006'),('SCHOOL_ADMIN','ADM-LIB-007'),
    ('SCHOOL_ADMIN','ADM-QUIZ'),    ('SCHOOL_ADMIN','ADM-QUIZ-001'),('SCHOOL_ADMIN','ADM-QUIZ-002'),

    -- PROFESSOR — dashboard + fórum
    ('PROFESSOR','PRF-001'),    ('PROFESSOR','PRF-001-001'),('PROFESSOR','PRF-001-002'),
    ('PROFESSOR','PRF-002'),    ('PROFESSOR','PRF-002-001'),('PROFESSOR','PRF-002-002'),
    -- PROFESSOR — biblioteca + metas
    ('PROFESSOR','PRF-LIB'),   ('PROFESSOR','PRF-LIB-001'),('PROFESSOR','PRF-LIB-002'),
    ('PROFESSOR','PRF-LIB-003'),('PROFESSOR','PRF-LIB-004'),('PROFESSOR','PRF-LIB-005'),
    ('PROFESSOR','PRF-LIB-006'),('PROFESSOR','PRF-LIB-007'),
    ('PROFESSOR','PRF-GOALS'), ('PROFESSOR','PRF-GOALS-001'),
    -- PROFESSOR — quiz + tarefas
    ('PROFESSOR','PRF-QUIZ'),  ('PROFESSOR','PRF-QUIZ-001'),('PROFESSOR','PRF-QUIZ-002'),
    ('PROFESSOR','PRF-ASG'),   ('PROFESSOR','PRF-ASG-001'),

    -- STUDENT — dashboard + fórum
    ('STUDENT','STD-001'),    ('STUDENT','STD-001-001'),('STUDENT','STD-001-002'),
    ('STUDENT','STD-002'),    ('STUDENT','STD-002-001'),('STUDENT','STD-002-002'),
    -- STUDENT — biblioteca + metas
    ('STUDENT','STD-LIB'),   ('STUDENT','STD-LIB-001'),('STUDENT','STD-LIB-002'),
    ('STUDENT','STD-LIB-003'),('STUDENT','STD-LIB-004'),('STUDENT','STD-LIB-005'),
    ('STUDENT','STD-LIB-006'),
    ('STUDENT','STD-GOALS'), ('STUDENT','STD-GOALS-001'),('STUDENT','STD-GOALS-002'),
    -- STUDENT — quiz + tarefas
    ('STUDENT','STD-QUIZ'),  ('STUDENT','STD-QUIZ-001'),('STUDENT','STD-QUIZ-002'),
    ('STUDENT','STD-ASG'),   ('STUDENT','STD-ASG-001'), ('STUDENT','STD-ASG-002'),

    -- GUEST — biblioteca pública
    ('GUEST','GST-001'),    ('GUEST','GST-LIB-001'),('GUEST','GST-LIB-002'),('GUEST','GST-LIB-003')

) AS v(role, tx_code)
JOIN app_transaction a ON a.code = v.tx_code

ON CONFLICT (role, app_transaction_id) DO NOTHING;

-- ============================================================
-- BLOCO 15 — ESG: Escola Secundária
-- ============================================================
ALTER TABLE IF EXISTS ac_SUBJECT ADD COLUMN IF NOT EXISTS CLASS_LEVEL_ID BIGINT NULL;
ALTER TABLE IF EXISTS ac_SUBJECT ADD COLUMN IF NOT EXISTS SCHOOL_ID BIGINT NULL;

INSERT INTO ac_school (id, status, created_by, created_date, last_modified_by, last_modified_date, name, city) VALUES
(4, 1, 0, NOW(), 0, NOW(), 'Escola Secundária SAE', 'Maputo')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
SELECT 'app_transaction' AS tabela, COUNT(*) AS total FROM app_transaction
UNION ALL
SELECT 'role_transaction', COUNT(*) FROM role_transaction;

-- ============================================================
-- BLOCO 17 — ESG: Turmas com turma_group
-- A coluna turma_group é adicionada pelo Hibernate (ddl-auto: update)
-- mas o ALTER TABLE garante compatibilidade em runs sem serviço activo.
-- ============================================================
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS turma_group VARCHAR(10);

INSERT INTO ac_classroom (id, status, created_by, created_date, last_modified_by, last_modified_date, name, school_id, class_level_id, shift, turma_group) VALUES
(21, 1, 0, NOW(), 0, NOW(), 'Turma A - 8ª Classe',                      4, 11, 'Manhã', NULL),
(22, 1, 0, NOW(), 0, NOW(), 'Turma A - 9ª Classe',                      4, 12, 'Manhã', NULL),
(23, 1, 0, NOW(), 0, NOW(), 'Turma A - 10ª Classe',                     4, 13, 'Manhã', NULL),
(24, 1, 0, NOW(), 0, NOW(), 'Turma A - 11ª Classe (Letras)',            4, 14, 'Manhã', 'A'),
(25, 1, 0, NOW(), 0, NOW(), 'Turma B - 11ª Classe (Ciências Bio)',      4, 14, 'Manhã', 'B'),
(26, 1, 0, NOW(), 0, NOW(), 'Turma C - 11ª Classe (Ciências Exactas)', 4, 14, 'Manhã', 'C'),
(27, 1, 0, NOW(), 0, NOW(), 'Turma A - 12ª Classe (Letras)',            4, 15, 'Manhã', 'A'),
(28, 1, 0, NOW(), 0, NOW(), 'Turma B - 12ª Classe (Ciências Bio)',      4, 15, 'Manhã', 'B'),
(29, 1, 0, NOW(), 0, NOW(), 'Turma C - 12ª Classe (Ciências Exactas)', 4, 15, 'Manhã', 'C')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_classroom', 'id'), 30);

-- ============================================================
-- BLOCO 18 — Actualizar codes dos subjects existentes
-- A coluna code é adicionada pelo Hibernate; o ALTER TABLE garante
-- que este bloco pode ser executado standalone.
-- ============================================================
ALTER TABLE IF EXISTS ac_subject ADD COLUMN IF NOT EXISTS code        VARCHAR(20);
ALTER TABLE IF EXISTS ac_subject ADD COLUMN IF NOT EXISTS description VARCHAR(1000);

UPDATE ac_subject SET code = 'MATEMATICA'  WHERE id = 1  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'PORTUGUES'   WHERE id = 2  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'FISICA'      WHERE id = 3  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'QUIMICA'     WHERE id = 4  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'HISTORIA'    WHERE id = 5  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'BIOLOGIA'    WHERE id = 6  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'INGLES'      WHERE id = 7  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'INFORMATICA' WHERE id = 8  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'PROGRAMACAO' WHERE id = 9  AND (code IS NULL OR code = '');
UPDATE ac_subject SET code = 'ECONOMIA'    WHERE id = 10 AND (code IS NULL OR code = '');

-- ============================================================
-- BLOCO 19 — Subjects em falta para o currículo ESG
-- ============================================================
INSERT INTO ac_subject (id, status, created_by, created_date, last_modified_by, last_modified_date, name, code) VALUES
(11, 1, 0, NOW(), 0, NOW(), 'Geografia', 'GEOGRAFIA'),
(12, 1, 0, NOW(), 0, NOW(), 'Filosofia', 'FILOSOFIA')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_subject', 'id'), 20);

-- ============================================================
-- BLOCO 20 — Currículo ESG: ac_class_level_subject
-- ⚠️  Esta tabela é criada pelo Hibernate (sae-academic-service).
--    Iniciar o serviço pelo menos uma vez antes de correr este bloco.
--
-- Subject IDs: 1=Mat, 2=Port, 3=Fís, 4=Quím, 5=Hist, 6=Bio,
--              7=Ingl, 8=Inf, 9=Prog, 10=Econ, 11=Geo, 12=Filos
-- ============================================================
INSERT INTO ac_class_level_subject (id, class_level_id, subject_id, turma_group) VALUES
-- 8ª Classe (comum a todos)
(1,  11, 1, NULL), (2,  11, 2, NULL), (3,  11, 7, NULL),
(4,  11, 5, NULL), (5,  11, 11, NULL), (6,  11, 6, NULL),
-- 9ª Classe (comum a todos)
(7,  12, 1, NULL), (8,  12, 2, NULL), (9,  12, 7, NULL),
(10, 12, 5, NULL), (11, 12, 11, NULL), (12, 12, 6, NULL),
-- 10ª Classe (comum + Física, Química, Informática)
(13, 13, 1, NULL), (14, 13, 2, NULL), (15, 13, 7, NULL),
(16, 13, 5, NULL), (17, 13, 11, NULL), (18, 13, 6, NULL),
(19, 13, 3, NULL), (20, 13, 4, NULL), (21, 13, 8, NULL),
-- 11ª Grupo A — Letras: Port, Mat, Ingl, Filos, Hist
(22, 14, 2, 'A'), (23, 14, 1, 'A'), (24, 14, 7, 'A'), (25, 14, 12, 'A'), (26, 14, 5, 'A'),
-- 11ª Grupo B — Ciências Bio: Port, Mat, Ingl, Filos, Fís, Quím, Bio
(27, 14, 2, 'B'), (28, 14, 1, 'B'), (29, 14, 7, 'B'), (30, 14, 12, 'B'),
(31, 14, 3, 'B'), (32, 14, 4, 'B'), (33, 14, 6, 'B'),
-- 11ª Grupo C — Ciências Exactas: Port, Mat, Ingl, Filos, Fís, Quím
(34, 14, 2, 'C'), (35, 14, 1, 'C'), (36, 14, 7, 'C'), (37, 14, 12, 'C'),
(38, 14, 3, 'C'), (39, 14, 4, 'C'),
-- 12ª Grupo A — Letras
(40, 15, 2, 'A'), (41, 15, 1, 'A'), (42, 15, 7, 'A'), (43, 15, 12, 'A'), (44, 15, 5, 'A'),
-- 12ª Grupo B — Ciências Bio
(45, 15, 2, 'B'), (46, 15, 1, 'B'), (47, 15, 7, 'B'), (48, 15, 12, 'B'),
(49, 15, 3, 'B'), (50, 15, 4, 'B'), (51, 15, 6, 'B'),
-- 12ª Grupo C — Ciências Exactas
(52, 15, 2, 'C'), (53, 15, 1, 'C'), (54, 15, 7, 'C'), (55, 15, 12, 'C'),
(56, 15, 3, 'C'), (57, 15, 4, 'C')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_class_level_subject', 'id'), 100);

-- ============================================================
-- BLOCO 21 — Actualizar student de teste para a 10ª Classe
-- Login: +258841111101
-- ============================================================
UPDATE student_profile
SET classroom_id = 23,
    school_id    = 4,
    grade        = '10ª Classe'
WHERE user_id = (SELECT id FROM sae_user WHERE username = '+258841111101');

-- ============================================================
-- BLOCO 22 — Matrícula de Estudantes + Professores (menus)
-- ============================================================

-- Menus SCHOOL_ADMIN: Estudantes e Professores
INSERT INTO app_transaction (id, status, code, type, label, router_link, position, parent_id) VALUES
(231, 1, 'SADM-STD',     'HEADER',    'Estudantes',   '/school-admin/students',   2, NULL),
(232, 1, 'SADM-STD-001', 'MENU_ITEM', 'Matrícula',    '/school-admin/students',   1, 231),
(233, 1, 'SADM-PRF',     'HEADER',    'Professores',  '/school-admin/professors', 3, NULL),
(234, 1, 'SADM-PRF-001', 'MENU_ITEM', 'Ver Perfis',   '/school-admin/professors', 1, 233)
ON CONFLICT (id) DO UPDATE SET
    status      = EXCLUDED.status, code        = EXCLUDED.code,
    type        = EXCLUDED.type,   label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link, position = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

INSERT INTO role_transaction (id, status, role, app_transaction_id) VALUES
(231, 1, 'SCHOOL_ADMIN', 231),
(232, 1, 'SCHOOL_ADMIN', 232),
(233, 1, 'SCHOOL_ADMIN', 233),
(234, 1, 'SCHOOL_ADMIN', 234)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status, role = EXCLUDED.role,
    app_transaction_id = EXCLUDED.app_transaction_id;

-- Menus ADMIN: Estudantes e Professores (sob Utilizadores)
INSERT INTO app_transaction (id, status, code, type, label, router_link, position, parent_id) VALUES
(235, 1, 'ADM-STD',     'MENU_ITEM', 'Estudantes',  '/admin/students',   5, 20),
(236, 1, 'ADM-PRF-LST', 'MENU_ITEM', 'Professores', '/admin/professors', 6, 20)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status, code = EXCLUDED.code, type = EXCLUDED.type,
    label = EXCLUDED.label, router_link = EXCLUDED.router_link,
    position = EXCLUDED.position, parent_id = EXCLUDED.parent_id;

INSERT INTO role_transaction (id, status, role, app_transaction_id) VALUES
(235, 1, 'ADMIN', 235),
(236, 1, 'ADMIN', 236)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status, role = EXCLUDED.role,
    app_transaction_id = EXCLUDED.app_transaction_id;

-- ============================================================
-- BLOCO 23 — Director de Turma: coluna + menu do professor
-- ============================================================

-- Coluna director_id na tabela de turmas (Hibernate cria via ddl-auto;
-- este ALTER garante compatibilidade em runs sem serviço activo).
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS director_id BIGINT NULL;

-- Menu item "Director de Turma" para o role PROFESSOR
INSERT INTO app_transaction (id, status, code, type, label, router_link, position, parent_id) VALUES
(230, 1, 'PRF-DIR', 'HEADER', 'Director de Turma', '/professor/director-classroom', 7, NULL)
ON CONFLICT (id) DO UPDATE SET
    status      = EXCLUDED.status,
    code        = EXCLUDED.code,
    type        = EXCLUDED.type,
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

INSERT INTO role_transaction (id, status, role, app_transaction_id) VALUES
(230, 1, 'PROFESSOR', 230)
ON CONFLICT (id) DO UPDATE SET
    status             = EXCLUDED.status,
    role               = EXCLUDED.role,
    app_transaction_id = EXCLUDED.app_transaction_id;

-- =============================================================================
-- NOTA: TODO o restante conteúdo é criado exclusivamente via frontend:
--   • Utilizadores         → /admin/users  ou  /signup
--   • Escolas              → /admin/academic/schools
--   • Níveis de Ensino     → /admin/academic/class-levels
--   • Turmas               → /admin/academic/classrooms
--   • Disciplinas          → /admin/academic/subjects  ← sync em tempo real no fórum
--   • Atribuições          → /admin/academic/professor-assignments
--   • Quizzes              → /professor/quiz/create
--   • Conteúdos biblioteca → /admin/library/upload  ou  /professor/library
-- =============================================================================

-- ============================================================
-- FIM DO SEED PostgreSQL
-- ============================================================
