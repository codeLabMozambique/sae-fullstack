-- =============================================================================
-- SAE — SEED COMPLETO DO SISTEMA
-- Base de Dados: sae_db (PostgreSQL)
-- Executar com: psql -U postgres -d sae_db -f seed.sql
--
-- SEGURO PARA RE-EXECUÇÃO:
--   • app_transaction  → ON CONFLICT (code)                    DO UPDATE
--   • role_transaction → ON CONFLICT (role, app_transaction_id) DO NOTHING
--   • Dados académicos → ON CONFLICT (id)                      DO NOTHING
--   • ALTER TABLE      → ADD COLUMN IF NOT EXISTS
-- =============================================================================

-- =============================================================================
-- SECÇÃO 1 — ESTRUTURA DAS TABELAS DE MENU
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

-- Sincroniza sequências com o MAX(id) actual (evita conflito de PK em re-execuções)
SELECT setval('app_transaction_id_seq',
    GREATEST(COALESCE((SELECT MAX(id) FROM app_transaction), 1), 1), true);
SELECT setval('role_transaction_id_seq',
    GREATEST(COALESCE((SELECT MAX(id) FROM role_transaction), 1), 1), true);

-- Constraint de roles válidos
ALTER TABLE role_transaction DROP CONSTRAINT IF EXISTS role_transaction_role_check;
ALTER TABLE role_transaction ADD CONSTRAINT role_transaction_role_check
    CHECK (role IN ('ROOT', 'ADMIN', 'SCHOOL_ADMIN', 'PROFESSOR', 'STUDENT', 'GUEST'));

-- Remove duplicados antes de criar o índice único (seguro em re-execuções)
DELETE FROM role_transaction
WHERE id NOT IN (
    SELECT MIN(id) FROM role_transaction GROUP BY role, app_transaction_id
);

ALTER TABLE role_transaction DROP CONSTRAINT IF EXISTS uq_role_transaction_role_menu;
ALTER TABLE role_transaction ADD CONSTRAINT uq_role_transaction_role_menu
    UNIQUE (role, app_transaction_id);

-- =============================================================================
-- PASSO 1 — HEADERS (entradas de topo, sem parent_id)
-- Inseridos primeiro para que os MENU_ITEMs os possam referenciar por code.
-- =============================================================================

INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id) VALUES
-- ROOT
(1, 'ROOT-000',    'HEADER', 'Sistema',               NULL,                             1, NULL),
-- ADMIN
(1, 'ADM-001',     'HEADER', 'Utilizadores',           '/admin/users',                   1, NULL),
(1, 'ADM-002',     'HEADER', 'Académico',               '/admin/academic',                2, NULL),
(1, 'ADM-LIB',    'HEADER', 'Biblioteca',              '/admin/library',                 3, NULL),
(1, 'ADM-QUIZ',   'HEADER', 'Quizzes',                 '/admin/quiz',                    4, NULL),
-- SCHOOL_ADMIN
(1, 'SADM-000',   'HEADER', 'Dashboard',               '/school-admin/dashboard',        1, NULL),
(1, 'SADM-STD',   'HEADER', 'Estudantes',              '/school-admin/students',         2, NULL),
(1, 'SADM-PRF',   'HEADER', 'Professores',             '/school-admin/professors',       3, NULL),
-- PROFESSOR
(1, 'PRF-001',    'HEADER', 'Dashboard',               '/professor/dashboard',           1, NULL),
(1, 'PRF-002',    'HEADER', 'Fórum',                   '/professor/forum',               2, NULL),
(1, 'PRF-LIB',   'HEADER', 'Biblioteca',              '/professor/library',             3, NULL),
(1, 'PRF-GOALS', 'HEADER', 'Metas de Estudo',         '/professor/goals',               4, NULL),
(1, 'PRF-QUIZ',  'HEADER', 'Quizzes',                 '/professor/quiz',                5, NULL),
(1, 'PRF-ASG',   'HEADER', 'Tarefas',                 '/professor/assignments',         6, NULL),
(1, 'PRF-DIR',   'HEADER', 'Director de Turma',        '/professor/director-classroom',  7, NULL),
-- STUDENT
(1, 'STD-001',   'HEADER', 'Dashboard',               '/student/dashboard',             1, NULL),
(1, 'STD-002',   'HEADER', 'Fórum',                   '/student/forum',                 2, NULL),
(1, 'STD-LIB',   'HEADER', 'Biblioteca',              '/student/library',               3, NULL),
(1, 'STD-GOALS', 'HEADER', 'Metas de Estudo',         '/student/goals',                 4, NULL),
(1, 'STD-QUIZ',  'HEADER', 'Preparação Exame',        '/student/quiz',                  5, NULL),
(1, 'STD-ASG',   'HEADER', 'Tarefas',                 '/student/assignments',           6, NULL),
-- GUEST
(1, 'GST-001',   'HEADER', 'Biblioteca',              '/biblioteca',                    1, NULL)

ON CONFLICT (code) DO UPDATE SET
    status      = EXCLUDED.status,
    type        = EXCLUDED.type,
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

-- =============================================================================
-- PASSO 2 — MENU_ITEMs (parent_id resolvido por code, sem IDs hardcoded)
-- =============================================================================

INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id)
SELECT v.status, v.code, v.type, v.label, v.router_link, v.position,
       (SELECT id FROM app_transaction WHERE code = v.parent_code)
FROM (VALUES

    -- ROOT
    (1,'ROOT-000-001','MENU_ITEM','Configurações de Rede',   '/root/settings',                        1,'ROOT-000'),
    (1,'ROOT-000-002','MENU_ITEM','Gestão de Admins',        '/root/admins',                          2,'ROOT-000'),

    -- ADMIN — Utilizadores
    (1,'ADM-001-001','MENU_ITEM','Listar Utilizadores',      '/admin/users/list',                     1,'ADM-001'),
    (1,'ADM-001-002','MENU_ITEM','Gerir Roles',              '/admin/users/roles',                    2,'ADM-001'),
    (1,'ADM-STD',    'MENU_ITEM','Estudantes',               '/admin/students',                       3,'ADM-001'),
    (1,'ADM-PRF-LST','MENU_ITEM','Professores',              '/admin/professors',                     4,'ADM-001'),

    -- ADMIN — Académico
    (1,'ADM-002-001','MENU_ITEM','Turmas',                   '/admin/academic/classrooms',            1,'ADM-002'),
    (1,'ADM-002-002','MENU_ITEM','Disciplinas',              '/admin/academic/subjects',              2,'ADM-002'),
    (1,'ADM-002-003','MENU_ITEM','Escolas',                  '/admin/academic/schools',               3,'ADM-002'),
    (1,'ADM-002-004','MENU_ITEM','Níveis de Ensino',         '/admin/academic/class-levels',          4,'ADM-002'),
    (1,'ADM-002-005','MENU_ITEM','Atribuições Professores',  '/admin/academic/professor-assignments', 5,'ADM-002'),
    (1,'ADM-002-006','MENU_ITEM','Grupos Académicos',        '/admin/academic/academic-groups',       6,'ADM-002'),
    (1,'ADM-002-007','MENU_ITEM','Currículo',                '/admin/academic/curriculum',            7,'ADM-002'),

    -- ADMIN — Biblioteca
    (1,'ADM-LIB-001','MENU_ITEM','Conteúdos',               '/admin/library/contents',               1,'ADM-LIB'),
    (1,'ADM-LIB-002','MENU_ITEM','Carregar Novo',           '/admin/library/upload',                 2,'ADM-LIB'),
    (1,'ADM-LIB-003','MENU_ITEM','Carregar em Lote',        '/admin/library/batch',                  3,'ADM-LIB'),
    (1,'ADM-LIB-004','MENU_ITEM','Categorias',              '/admin/library/categories',             4,'ADM-LIB'),
    (1,'ADM-LIB-005','MENU_ITEM','Disciplinas',             '/admin/library/disciplines',            5,'ADM-LIB'),
    (1,'ADM-LIB-006','MENU_ITEM','Logs de Auditoria',       '/admin/library/logs',                   6,'ADM-LIB'),
    (1,'ADM-LIB-007','MENU_ITEM','Leitura Offline',         '/admin/library/offline',                7,'ADM-LIB'),

    -- ADMIN — Quiz
    (1,'ADM-QUIZ-001','MENU_ITEM','Gerir Quizzes',          '/admin/quiz/manage',                    1,'ADM-QUIZ'),
    (1,'ADM-QUIZ-002','MENU_ITEM','Criar Quiz',             '/admin/quiz/create',                    2,'ADM-QUIZ'),

    -- SCHOOL_ADMIN — Dashboard
    (1,'SADM-000-001','MENU_ITEM','Visão Geral',            '/school-admin/dashboard',               1,'SADM-000'),
    (1,'SADM-000-002','MENU_ITEM','Estatísticas',           '/school-admin/dashboard/stats',         2,'SADM-000'),
    -- SCHOOL_ADMIN — Estudantes e Professores
    (1,'SADM-STD-001','MENU_ITEM','Matrícula',              '/school-admin/students',                1,'SADM-STD'),
    (1,'SADM-PRF-001','MENU_ITEM','Ver Perfis',             '/school-admin/professors',              1,'SADM-PRF'),

    -- PROFESSOR — Dashboard
    (1,'PRF-001-001','MENU_ITEM','Minhas Turmas',           '/professor/classes',                    1,'PRF-001'),
    (1,'PRF-001-002','MENU_ITEM','Gestão de Notas',         '/professor/grades',                     2,'PRF-001'),
    -- PROFESSOR — Fórum
    (1,'PRF-002-001','MENU_ITEM','Perguntas Pendentes',     '/professor/forum/pending',              1,'PRF-002'),
    (1,'PRF-002-002','MENU_ITEM','Respondidas',             '/professor/forum/answered',             2,'PRF-002'),
    -- PROFESSOR — Biblioteca
    (1,'PRF-LIB-001','MENU_ITEM','Pesquisar',               '/professor/library',                    1,'PRF-LIB'),
    (1,'PRF-LIB-002','MENU_ITEM','Os Meus Conteúdos',      '/professor/library/my-content',         2,'PRF-LIB'),
    (1,'PRF-LIB-003','MENU_ITEM','Categorias',              '/professor/library/categories',         3,'PRF-LIB'),
    (1,'PRF-LIB-004','MENU_ITEM','Favoritos',               '/professor/library/favorites',          4,'PRF-LIB'),
    (1,'PRF-LIB-005','MENU_ITEM','Continuar a Ler',         '/professor/library/progress',           5,'PRF-LIB'),
    (1,'PRF-LIB-006','MENU_ITEM','Histórico',               '/professor/library/history',            6,'PRF-LIB'),
    (1,'PRF-LIB-007','MENU_ITEM','Leitura Offline',         '/professor/library/offline',            7,'PRF-LIB'),
    -- PROFESSOR — Metas
    (1,'PRF-GOALS-001','MENU_ITEM','Minhas Metas',          '/professor/goals',                      1,'PRF-GOALS'),
    -- PROFESSOR — Quiz
    (1,'PRF-QUIZ-001','MENU_ITEM','Gerir Quizzes',          '/professor/quiz/manage',                1,'PRF-QUIZ'),
    (1,'PRF-QUIZ-002','MENU_ITEM','Criar Quiz',             '/professor/quiz/create',                2,'PRF-QUIZ'),
    -- PROFESSOR — Tarefas
    (1,'PRF-ASG-001','MENU_ITEM','Gerir Tarefas',           '/professor/assignments',                1,'PRF-ASG'),

    -- STUDENT — Dashboard
    (1,'STD-001-001','MENU_ITEM','Minhas Aulas',            '/student/classes',                      1,'STD-001'),
    (1,'STD-001-002','MENU_ITEM','Notas',                   '/student/grades',                       2,'STD-001'),
    -- STUDENT — Fórum
    (1,'STD-002-001','MENU_ITEM','Minhas Perguntas',        '/student/forum/questions',              1,'STD-002'),
    (1,'STD-002-002','MENU_ITEM','Nova Pergunta',           '/student/forum/new',                    2,'STD-002'),
    -- STUDENT — Biblioteca
    (1,'STD-LIB-001','MENU_ITEM','Pesquisar',               '/student/library',                      1,'STD-LIB'),
    (1,'STD-LIB-002','MENU_ITEM','Categorias',              '/student/library/categories',           2,'STD-LIB'),
    (1,'STD-LIB-003','MENU_ITEM','Favoritos',               '/student/library/favorites',            3,'STD-LIB'),
    (1,'STD-LIB-004','MENU_ITEM','Continuar a Ler',         '/student/library/progress',             4,'STD-LIB'),
    (1,'STD-LIB-005','MENU_ITEM','Histórico',               '/student/library/history',              5,'STD-LIB'),
    (1,'STD-LIB-006','MENU_ITEM','Leitura Offline',         '/student/library/offline',              6,'STD-LIB'),
    -- STUDENT — Metas
    (1,'STD-GOALS-001','MENU_ITEM','Minhas Metas',          '/student/goals',                        1,'STD-GOALS'),
    (1,'STD-GOALS-002','MENU_ITEM','Nova Meta',             '/student/goals/new',                    2,'STD-GOALS'),
    -- STUDENT — Quiz
    (1,'STD-QUIZ-001','MENU_ITEM','Escolher Quiz',          '/student/quiz',                         1,'STD-QUIZ'),
    (1,'STD-QUIZ-002','MENU_ITEM','Os Meus Resultados',     '/student/quiz/results',                 2,'STD-QUIZ'),
    (1,'STD-QUIZ-003','MENU_ITEM','Os Meus Certificados',   '/student/certificates',                 3,'STD-QUIZ'),
    -- STUDENT — Tarefas
    (1,'STD-ASG-001','MENU_ITEM','Minhas Tarefas',          '/student/assignments',                  1,'STD-ASG'),
    (1,'STD-ASG-002','MENU_ITEM','Histórico Entregas',      '/student/submissions',                  2,'STD-ASG'),

    -- GUEST — Biblioteca pública
    (1,'GST-LIB-001','MENU_ITEM','Pesquisar',               '/biblioteca',                           1,'GST-001'),
    (1,'GST-LIB-002','MENU_ITEM','Categorias',              '/biblioteca/categorias',                2,'GST-001'),
    (1,'GST-LIB-003','MENU_ITEM','Chat IA',                 '/biblioteca/chat',                      3,'GST-001')

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
-- Resolução por code; sem IDs hardcoded; duplicados ignorados silenciosamente.
-- =============================================================================

INSERT INTO role_transaction (status, role, app_transaction_id)
SELECT 1, v.role, a.id
FROM (VALUES

    -- ROOT
    ('ROOT','ROOT-000'), ('ROOT','ROOT-000-001'), ('ROOT','ROOT-000-002'),

    -- ADMIN — utilizadores (inclui Estudantes e Professores)
    ('ADMIN','ADM-001'),     ('ADMIN','ADM-001-001'), ('ADMIN','ADM-001-002'),
    ('ADMIN','ADM-STD'),     ('ADMIN','ADM-PRF-LST'),
    -- ADMIN — académico (todos os itens, incluindo Grupos e Currículo)
    ('ADMIN','ADM-002'),     ('ADMIN','ADM-002-001'), ('ADMIN','ADM-002-002'),
    ('ADMIN','ADM-002-003'), ('ADMIN','ADM-002-004'), ('ADMIN','ADM-002-005'),
    ('ADMIN','ADM-002-006'), ('ADMIN','ADM-002-007'),
    -- ADMIN — biblioteca
    ('ADMIN','ADM-LIB'),     ('ADMIN','ADM-LIB-001'), ('ADMIN','ADM-LIB-002'),
    ('ADMIN','ADM-LIB-003'), ('ADMIN','ADM-LIB-004'), ('ADMIN','ADM-LIB-005'),
    ('ADMIN','ADM-LIB-006'), ('ADMIN','ADM-LIB-007'),
    -- ADMIN — quiz
    ('ADMIN','ADM-QUIZ'),    ('ADMIN','ADM-QUIZ-001'),('ADMIN','ADM-QUIZ-002'),

    -- SCHOOL_ADMIN — dashboard próprio + estudantes + professores
    ('SCHOOL_ADMIN','SADM-000'),    ('SCHOOL_ADMIN','SADM-000-001'),('SCHOOL_ADMIN','SADM-000-002'),
    ('SCHOOL_ADMIN','SADM-STD'),    ('SCHOOL_ADMIN','SADM-STD-001'),
    ('SCHOOL_ADMIN','SADM-PRF'),    ('SCHOOL_ADMIN','SADM-PRF-001'),
    -- SCHOOL_ADMIN — gestão académica partilhada (sem Escolas nem Níveis de Ensino)
    ('SCHOOL_ADMIN','ADM-001'),     ('SCHOOL_ADMIN','ADM-001-001'),('SCHOOL_ADMIN','ADM-001-002'),
    ('SCHOOL_ADMIN','ADM-STD'),     ('SCHOOL_ADMIN','ADM-PRF-LST'),
    ('SCHOOL_ADMIN','ADM-002'),     ('SCHOOL_ADMIN','ADM-002-001'),('SCHOOL_ADMIN','ADM-002-002'),
    ('SCHOOL_ADMIN','ADM-002-005'), ('SCHOOL_ADMIN','ADM-002-006'),('SCHOOL_ADMIN','ADM-002-007'),
    -- SCHOOL_ADMIN — biblioteca + quiz
    ('SCHOOL_ADMIN','ADM-LIB'),     ('SCHOOL_ADMIN','ADM-LIB-001'),('SCHOOL_ADMIN','ADM-LIB-002'),
    ('SCHOOL_ADMIN','ADM-LIB-003'), ('SCHOOL_ADMIN','ADM-LIB-004'),('SCHOOL_ADMIN','ADM-LIB-005'),
    ('SCHOOL_ADMIN','ADM-LIB-006'), ('SCHOOL_ADMIN','ADM-LIB-007'),
    ('SCHOOL_ADMIN','ADM-QUIZ'),    ('SCHOOL_ADMIN','ADM-QUIZ-001'),('SCHOOL_ADMIN','ADM-QUIZ-002'),

    -- PROFESSOR — dashboard + fórum
    ('PROFESSOR','PRF-001'),    ('PROFESSOR','PRF-001-001'),('PROFESSOR','PRF-001-002'),
    ('PROFESSOR','PRF-002'),    ('PROFESSOR','PRF-002-001'),('PROFESSOR','PRF-002-002'),
    -- PROFESSOR — biblioteca + metas
    ('PROFESSOR','PRF-LIB'),   ('PROFESSOR','PRF-LIB-001'),('PROFESSOR','PRF-LIB-002'),
    ('PROFESSOR','PRF-LIB-003'),('PROFESSOR','PRF-LIB-004'),('PROFESSOR','PRF-LIB-005'),
    ('PROFESSOR','PRF-LIB-006'),('PROFESSOR','PRF-LIB-007'),
    ('PROFESSOR','PRF-GOALS'), ('PROFESSOR','PRF-GOALS-001'),
    -- PROFESSOR — quiz + tarefas + director de turma
    ('PROFESSOR','PRF-QUIZ'),  ('PROFESSOR','PRF-QUIZ-001'),('PROFESSOR','PRF-QUIZ-002'),
    ('PROFESSOR','PRF-ASG'),   ('PROFESSOR','PRF-ASG-001'),
    ('PROFESSOR','PRF-DIR'),

    -- STUDENT — dashboard + fórum
    ('STUDENT','STD-001'),    ('STUDENT','STD-001-001'),('STUDENT','STD-001-002'),
    ('STUDENT','STD-002'),    ('STUDENT','STD-002-001'),('STUDENT','STD-002-002'),
    -- STUDENT — biblioteca + metas
    ('STUDENT','STD-LIB'),   ('STUDENT','STD-LIB-001'),('STUDENT','STD-LIB-002'),
    ('STUDENT','STD-LIB-003'),('STUDENT','STD-LIB-004'),('STUDENT','STD-LIB-005'),
    ('STUDENT','STD-LIB-006'),('STUDENT','STD-LIB-007'),
    ('STUDENT','STD-GOALS'), ('STUDENT','STD-GOALS-001'),('STUDENT','STD-GOALS-002'),
    -- STUDENT — quiz + tarefas
    ('STUDENT','STD-QUIZ'),  ('STUDENT','STD-QUIZ-001'),('STUDENT','STD-QUIZ-002'),('STUDENT','STD-QUIZ-003'),
    ('STUDENT','STD-ASG'),   ('STUDENT','STD-ASG-001'), ('STUDENT','STD-ASG-002'),

    -- GUEST — biblioteca pública
    ('GUEST','GST-001'),    ('GUEST','GST-LIB-001'),('GUEST','GST-LIB-002'),('GUEST','GST-LIB-003')

) AS v(role, tx_code)
JOIN app_transaction a ON a.code = v.tx_code

ON CONFLICT (role, app_transaction_id) DO NOTHING;

-- =============================================================================
-- BLOCO 15 — Escola de teste (ESG)
-- =============================================================================
ALTER TABLE IF EXISTS ac_subject ADD COLUMN IF NOT EXISTS class_level_id BIGINT NULL;
ALTER TABLE IF EXISTS ac_subject ADD COLUMN IF NOT EXISTS school_id       BIGINT NULL;

INSERT INTO ac_school (id, status, created_by, created_date, last_modified_by, last_modified_date, name, city)
VALUES (4, 1, 0, NOW(), 0, NOW(), 'Escola Secundária SAE', 'Maputo')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BLOCO 16 — Níveis de Ensino ESG (8ª–12ª Classe) com campo de ciclo
-- =============================================================================
ALTER TABLE IF EXISTS ac_class_level ADD COLUMN IF NOT EXISTS cycle VARCHAR(10);

-- ============================================================
-- BLOCO 17 — ESG: Turmas com turma_group
-- A coluna turma_group é adicionada pelo Hibernate (ddl-auto: update)
-- mas o ALTER TABLE garante compatibilidade em runs sem serviço activo.
-- ============================================================
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS turma_group VARCHAR(10);

-- Garantir que os níveis de ensino 11-15 (8ª–12ª) existem antes da FK das turmas
INSERT INTO ac_class_level (id, status, created_by, created_date, last_modified_by, last_modified_date, name, cycle) VALUES
(11, 1, 0, NOW(), 0, NOW(), '8ª Classe',  'BASICO'),
(12, 1, 0, NOW(), 0, NOW(), '9ª Classe',  'BASICO'),
(13, 1, 0, NOW(), 0, NOW(), '10ª Classe', 'BASICO'),
(14, 1, 0, NOW(), 0, NOW(), '11ª Classe', 'MEDIO'),
(15, 1, 0, NOW(), 0, NOW(), '12ª Classe', 'MEDIO')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_class_level', 'id'), GREATEST((SELECT MAX(id) FROM ac_class_level), 15));

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

-- Garante que níveis já existentes ficam com o ciclo correcto
UPDATE ac_class_level SET cycle = 'BASICO' WHERE id IN (11, 12, 13) AND (cycle IS NULL OR cycle = '');
UPDATE ac_class_level SET cycle = 'MEDIO'  WHERE id IN (14, 15)     AND (cycle IS NULL OR cycle = '');

SELECT setval(pg_get_serial_sequence('ac_class_level', 'id'), 20);

-- =============================================================================
-- BLOCO 17 — Grupos Académicos (aplicam-se às turmas do ciclo médio)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ac_academic_group (
    id                 BIGSERIAL    PRIMARY KEY,
    status             SMALLINT     NOT NULL DEFAULT 1,
    created_by         BIGINT,
    created_date       TIMESTAMP,
    last_modified_by   BIGINT,
    last_modified_date TIMESTAMP,
    name               VARCHAR(256) NOT NULL,
    code               VARCHAR(20),
    description        VARCHAR(500),
    school_id          BIGINT       REFERENCES ac_school(id)
);

INSERT INTO ac_academic_group (id, status, created_by, created_date, last_modified_by, last_modified_date, name, code, school_id) VALUES
(1, 1, 0, NOW(), 0, NOW(), 'Grupo A — Letras com Matemática',  'A', 4),
(2, 1, 0, NOW(), 0, NOW(), 'Grupo B — Ciências com Biologia',  'B', 4),
(3, 1, 0, NOW(), 0, NOW(), 'Grupo C — Ciências Exactas',        'C', 4)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_academic_group', 'id'), 10);

-- =============================================================================
-- BLOCO 18 — Turmas ESG com grupo académico e director de turma
-- =============================================================================
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS turma_group       VARCHAR(10);
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS academic_group_id BIGINT REFERENCES ac_academic_group(id);
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS director_id       BIGINT NULL;
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS academic_year     VARCHAR(20);

INSERT INTO ac_classroom (id, status, created_by, created_date, last_modified_by, last_modified_date,
                          name, school_id, class_level_id, shift, academic_year, turma_group, academic_group_id) VALUES
(21, 1, 0, NOW(), 0, NOW(), 'Turma A - 8ª Classe',                      4, 11, 'Manhã', '2025', NULL, NULL),
(22, 1, 0, NOW(), 0, NOW(), 'Turma A - 9ª Classe',                      4, 12, 'Manhã', '2025', NULL, NULL),
(23, 1, 0, NOW(), 0, NOW(), 'Turma A - 10ª Classe',                     4, 13, 'Manhã', '2025', NULL, NULL),
(24, 1, 0, NOW(), 0, NOW(), 'Turma A - 11ª Classe (Letras)',            4, 14, 'Manhã', '2025', 'A',  1),
(25, 1, 0, NOW(), 0, NOW(), 'Turma B - 11ª Classe (Ciências Bio)',      4, 14, 'Manhã', '2025', 'B',  2),
(26, 1, 0, NOW(), 0, NOW(), 'Turma C - 11ª Classe (Ciências Exactas)', 4, 14, 'Manhã', '2025', 'C',  3),
(27, 1, 0, NOW(), 0, NOW(), 'Turma A - 12ª Classe (Letras)',            4, 15, 'Manhã', '2025', 'A',  1),
(28, 1, 0, NOW(), 0, NOW(), 'Turma B - 12ª Classe (Ciências Bio)',      4, 15, 'Manhã', '2025', 'B',  2),
(29, 1, 0, NOW(), 0, NOW(), 'Turma C - 12ª Classe (Ciências Exactas)', 4, 15, 'Manhã', '2025', 'C',  3)
ON CONFLICT (id) DO NOTHING;

-- Migra turmas já existentes que ainda não têm academic_group_id preenchido
UPDATE ac_classroom
SET academic_group_id = CASE turma_group WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 END
WHERE turma_group IS NOT NULL AND academic_group_id IS NULL;

SELECT setval(pg_get_serial_sequence('ac_classroom', 'id'), 30);

-- =============================================================================
-- BLOCO 19 — Codes das disciplinas existentes
-- =============================================================================
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

-- =============================================================================
-- BLOCO 20 — Disciplinas em falta para o currículo ESG
-- =============================================================================
INSERT INTO ac_subject (id, status, created_by, created_date, last_modified_by, last_modified_date, name, code) VALUES
(11, 1, 0, NOW(), 0, NOW(), 'Geografia', 'GEOGRAFIA'),
(12, 1, 0, NOW(), 0, NOW(), 'Filosofia', 'FILOSOFIA')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_subject', 'id'), 20);

-- =============================================================================
-- BLOCO 21 — Currículo ESG: ac_class_level_subject
-- ⚠️  Esta tabela é criada pelo Hibernate (sae-academic-service).
--     Iniciar o serviço pelo menos uma vez antes de correr este bloco.
--
-- IDs das disciplinas:
--   1=Mat  2=Port  3=Fís  4=Quím  5=Hist  6=Bio
--   7=Ingl 8=Inf   9=Prog 10=Econ 11=Geo  12=Filos
-- =============================================================================
ALTER TABLE IF EXISTS ac_class_level_subject
    ADD COLUMN IF NOT EXISTS school_id         BIGINT REFERENCES ac_school(id);
ALTER TABLE IF EXISTS ac_class_level_subject
    ADD COLUMN IF NOT EXISTS turma_group       VARCHAR(10);
ALTER TABLE IF EXISTS ac_class_level_subject
    ADD COLUMN IF NOT EXISTS academic_group_id BIGINT REFERENCES ac_academic_group(id);

-- school_id=4 = Escola Secundária SAE (ESG)
INSERT INTO ac_class_level_subject (id, school_id, class_level_id, subject_id, turma_group, academic_group_id) VALUES
-- 8ª Classe — comum a todos (sem grupo)
( 1, 4, 11,  1, NULL, NULL), ( 2, 4, 11,  2, NULL, NULL), ( 3, 4, 11,  7, NULL, NULL),
( 4, 4, 11,  5, NULL, NULL), ( 5, 4, 11, 11, NULL, NULL), ( 6, 4, 11,  6, NULL, NULL),
-- 9ª Classe — comum a todos
( 7, 4, 12,  1, NULL, NULL), ( 8, 4, 12,  2, NULL, NULL), ( 9, 4, 12,  7, NULL, NULL),
(10, 4, 12,  5, NULL, NULL), (11, 4, 12, 11, NULL, NULL), (12, 4, 12,  6, NULL, NULL),
-- 10ª Classe — comum + Física, Química, Informática
(13, 4, 13,  1, NULL, NULL), (14, 4, 13,  2, NULL, NULL), (15, 4, 13,  7, NULL, NULL),
(16, 4, 13,  5, NULL, NULL), (17, 4, 13, 11, NULL, NULL), (18, 4, 13,  6, NULL, NULL),
(19, 4, 13,  3, NULL, NULL), (20, 4, 13,  4, NULL, NULL), (21, 4, 13,  8, NULL, NULL),
-- 11ª Grupo A — Letras: Port, Mat, Ingl, Filos, Hist
(22, 4, 14,  2, 'A', 1), (23, 4, 14,  1, 'A', 1), (24, 4, 14,  7, 'A', 1),
(25, 4, 14, 12, 'A', 1), (26, 4, 14,  5, 'A', 1),
-- 11ª Grupo B — Ciências Bio: Port, Mat, Ingl, Filos, Fís, Quím, Bio
(27, 4, 14,  2, 'B', 2), (28, 4, 14,  1, 'B', 2), (29, 4, 14,  7, 'B', 2),
(30, 4, 14, 12, 'B', 2), (31, 4, 14,  3, 'B', 2), (32, 4, 14,  4, 'B', 2), (33, 4, 14,  6, 'B', 2),
-- 11ª Grupo C — Ciências Exactas: Port, Mat, Ingl, Filos, Fís, Quím
(34, 4, 14,  2, 'C', 3), (35, 4, 14,  1, 'C', 3), (36, 4, 14,  7, 'C', 3),
(37, 4, 14, 12, 'C', 3), (38, 4, 14,  3, 'C', 3), (39, 4, 14,  4, 'C', 3),
-- 12ª Grupo A — Letras
(40, 4, 15,  2, 'A', 1), (41, 4, 15,  1, 'A', 1), (42, 4, 15,  7, 'A', 1),
(43, 4, 15, 12, 'A', 1), (44, 4, 15,  5, 'A', 1),
-- 12ª Grupo B — Ciências Bio
(45, 4, 15,  2, 'B', 2), (46, 4, 15,  1, 'B', 2), (47, 4, 15,  7, 'B', 2),
(48, 4, 15, 12, 'B', 2), (49, 4, 15,  3, 'B', 2), (50, 4, 15,  4, 'B', 2), (51, 4, 15,  6, 'B', 2),
-- 12ª Grupo C — Ciências Exactas
(52, 4, 15,  2, 'C', 3), (53, 4, 15,  1, 'C', 3), (54, 4, 15,  7, 'C', 3),
(55, 4, 15, 12, 'C', 3), (56, 4, 15,  3, 'C', 3), (57, 4, 15,  4, 'C', 3)
ON CONFLICT (id) DO NOTHING;

-- Migra linhas já existentes sem school_id ou academic_group_id
UPDATE ac_class_level_subject
SET school_id = 4
WHERE school_id IS NULL;

UPDATE ac_class_level_subject
SET academic_group_id = CASE turma_group WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 END
WHERE turma_group IS NOT NULL
  AND class_level_id IN (14, 15)
  AND academic_group_id IS NULL;

SELECT setval(pg_get_serial_sequence('ac_class_level_subject', 'id'), 100);

-- =============================================================================
-- BLOCO 22 — Perfil do professor: ciclo de ensino
-- =============================================================================
ALTER TABLE IF EXISTS professor_profile
    ADD COLUMN IF NOT EXISTS teaching_cycle VARCHAR(10);

-- ============================================================
-- FIM DO SEED PostgreSQL
--
-- ⚠️  MongoDB também precisa de seed (categorias da biblioteca).
--    Ver ficheiro: mongo-seed.js
--    Correr com:
--      Get-Content "caminho\ficheiro.js" | docker exec -i sae-mongodb mongosh sae_content
--
-- ⚠️  CONTEÚDOS (PDFs) requerem ficheiros reais no MinIO. Não são
--    seedados via SQL/JSON — fazer upload via:
--      POST /api/professor/contents  ou  POST /api/admin/contents
-- ============================================================

-- =============================================================================
-- BLOCO 23 — Actualizar estudante de teste para a 10ª Classe
-- Login: +258841111101
-- =============================================================================
UPDATE student_profile
SET classroom_id = 23, school_id = 4, grade = '10ª Classe'
WHERE user_id = (SELECT id FROM sae_user WHERE username = '+258841111101');

-- =============================================================================
-- BLOCO 24 — Quiz: migração de disciplina (enum) → subject_id (FK académico)
-- =============================================================================
ALTER TABLE IF EXISTS quiz
    ALTER COLUMN disciplina DROP NOT NULL;
ALTER TABLE IF EXISTS quiz
    ADD COLUMN IF NOT EXISTS subject_id BIGINT;
ALTER TABLE IF EXISTS quiz
    ADD COLUMN IF NOT EXISTS subject_name VARCHAR(200);

-- =============================================================================
-- BLOCO 25 — Professor: fluxo de aprovação
-- =============================================================================
ALTER TABLE professor_profile
    ADD COLUMN IF NOT EXISTS approval_status   VARCHAR(20)  NOT NULL DEFAULT 'APPROVED';
ALTER TABLE professor_profile
    ADD COLUMN IF NOT EXISTS rejection_reason  VARCHAR(500);
ALTER TABLE professor_profile
    ADD COLUMN IF NOT EXISTS id_document_number VARCHAR(50);

-- Professores existentes ficam APPROVED (já foram validados manualmente)
UPDATE professor_profile SET approval_status = 'APPROVED' WHERE approval_status IS NULL OR approval_status = '';

-- =============================================================================
-- BLOCO 26 — Certificados de apoio de professor (feature D)
-- =============================================================================
CREATE TABLE IF NOT EXISTS professor_certificate (
    id                     BIGSERIAL    PRIMARY KEY,
    professor_username     VARCHAR(256) NOT NULL,
    discipline             VARCHAR(256) NOT NULL,
    assistance_percentage  DOUBLE PRECISION NOT NULL,
    total_answered         BIGINT       NOT NULL DEFAULT 0,
    is_public              BOOLEAN      NOT NULL DEFAULT FALSE,
    issued_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    published_at           TIMESTAMP,
    UNIQUE (professor_username, discipline)
);

-- =============================================================================
-- BLOCO 27 — Menu: mapeamento de todas as novas rotas implementadas
--
-- Novas entradas:
--   ADMIN    → Dashboard (/admin/dashboard)
--              Fórum     (/admin/forum)
--              Relatórios (/admin/reports)
--   PROFESSOR → Certificados (/professor/certificates)
--               Sugerir Leitura (/professor/library/suggest)
--   STUDENT   → Sugestões de Leitura (/student/library/suggestions)
-- =============================================================================

-- ── 27a. Novos HEADERS ────────────────────────────────────────────────────────
INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id) VALUES
-- ADMIN: Dashboard (posição 0 — aparece primeiro no menu)
(1, 'ADM-DASH',  'HEADER', 'Dashboard',   '/admin/dashboard', 0, NULL),
-- ADMIN: Fórum (posição 5 — após Quizzes)
(1, 'ADM-FORUM', 'HEADER', 'Fórum',        '/admin/forum',    5, NULL),
-- ADMIN: Relatórios (posição 6)
(1, 'ADM-RPT',   'HEADER', 'Relatórios',   '/admin/reports',  6, NULL),
-- PROFESSOR: Certificados de Apoio (posição 8 — após Director de Turma)
(1, 'PRF-CERT',  'HEADER', 'Certificados', '/professor/certificates', 8, NULL)
ON CONFLICT (code) DO UPDATE SET
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position;

-- ── 27b. Novos MENU_ITEMs ─────────────────────────────────────────────────────
INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id)
SELECT v.status, v.code, v.type, v.label, v.router_link, v.position,
       (SELECT id FROM app_transaction WHERE code = v.parent_code)
FROM (VALUES
    -- ADMIN — Dashboard
    (1,'ADM-DASH-001', 'MENU_ITEM','Visão Geral',                '/admin/dashboard',                   1,'ADM-DASH'),
    -- ADMIN — Fórum
    (1,'ADM-FORUM-001','MENU_ITEM','Ver Fórum',                  '/admin/forum',                        1,'ADM-FORUM'),
    -- ADMIN — Relatórios
    (1,'ADM-RPT-001',  'MENU_ITEM','Relatório de Atendimento',   '/admin/reports',                      1,'ADM-RPT'),
    -- PROFESSOR — Certificados
    (1,'PRF-CERT-001', 'MENU_ITEM','Os Meus Certificados',       '/professor/certificates',             1,'PRF-CERT'),
    -- PROFESSOR — Biblioteca: sugerir leitura (posição 8, após Offline)
    (1,'PRF-LIB-008',  'MENU_ITEM','Sugerir Leitura',            '/professor/library/suggest',          8,'PRF-LIB'),
    -- STUDENT — Biblioteca: sugestões de leitura (posição 7, após Offline)
    (1,'STD-LIB-007',  'MENU_ITEM','Sugestões de Leitura',       '/student/library/suggestions',        7,'STD-LIB')
) AS v(status, code, type, label, router_link, position, parent_code)
ON CONFLICT (code) DO UPDATE SET
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

-- ── 27c. ROLE_TRANSACTION — permissões por role ───────────────────────────────
INSERT INTO role_transaction (status, role, app_transaction_id)
SELECT 1, v.role, a.id
FROM (VALUES
    -- ADMIN — novos módulos (Dashboard, Fórum, Relatórios)
    ('ADMIN','ADM-DASH'),       ('ADMIN','ADM-DASH-001'),
    ('ADMIN','ADM-FORUM'),      ('ADMIN','ADM-FORUM-001'),
    ('ADMIN','ADM-RPT'),        ('ADMIN','ADM-RPT-001'),

    -- SCHOOL_ADMIN — acesso aos mesmos módulos de admin
    ('SCHOOL_ADMIN','ADM-DASH'),      ('SCHOOL_ADMIN','ADM-DASH-001'),
    ('SCHOOL_ADMIN','ADM-FORUM'),     ('SCHOOL_ADMIN','ADM-FORUM-001'),
    ('SCHOOL_ADMIN','ADM-RPT'),       ('SCHOOL_ADMIN','ADM-RPT-001'),

    -- PROFESSOR — certificados + sugerir leitura
    ('PROFESSOR','PRF-CERT'),         ('PROFESSOR','PRF-CERT-001'),
    ('PROFESSOR','PRF-LIB-008'),

    -- STUDENT — sugestões de leitura recebidas
    ('STUDENT','STD-LIB-007')

) AS v(role, tx_code)
JOIN app_transaction a ON a.code = v.tx_code
ON CONFLICT (role, app_transaction_id) DO NOTHING;

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
SELECT 'app_transaction' AS tabela, COUNT(*) AS total FROM app_transaction
UNION ALL
SELECT 'role_transaction', COUNT(*) FROM role_transaction
UNION ALL
SELECT 'ac_academic_group',  COUNT(*) FROM ac_academic_group
UNION ALL
SELECT 'ac_class_level',     COUNT(*) FROM ac_class_level
UNION ALL
SELECT 'ac_classroom',       COUNT(*) FROM ac_classroom;

-- =============================================================================
-- BLOCO 28 — Coluna must_change_password em sae_user (safe re-run)
-- =============================================================================
ALTER TABLE sae_user ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- NOTA: Todo o restante conteúdo é criado exclusivamente via frontend:
--   • Utilizadores         → /admin/users  ou  /signup
--   • Escolas              → /admin/academic/schools
--   • Níveis de Ensino     → /admin/academic/class-levels
--   • Turmas               → /admin/academic/classrooms
--   • Disciplinas          → /admin/academic/subjects
--   • Grupos Académicos    → /admin/academic/academic-groups
--   • Currículo            → /admin/academic/curriculum
--   • Atribuições          → /admin/academic/professor-assignments
--   • Quizzes              → /professor/quiz/create
--   • Conteúdos biblioteca → /admin/library/upload
-- =============================================================================