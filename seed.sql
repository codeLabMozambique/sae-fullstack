-- =============================================================================
-- SAE — SEED COMPLETO DO SISTEMA
-- Base de Dados: sae_db (PostgreSQL)
-- Executar com: psql -U postgres -d sae_db -f seed.sql
--
-- SEGURO PARA RE-EXECUÇÃO:
--   • app_transaction  → ON CONFLICT (code)                    DO UPDATE
--   • role_transaction → ON CONFLICT (role, app_transaction_id) DO NOTHING
--   • Dados académicos → ON CONFLICT (id)                      DO UPDATE
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
-- LIMPEZA — Remove itens de menu obsoletos (safe em re-execuções)
-- =============================================================================
DELETE FROM role_transaction WHERE app_transaction_id IN (
    SELECT id FROM app_transaction WHERE code IN ('PRF-002-002', 'PRF-QUIZ-002', 'STD-002-002', 'STD-001-001', 'STD-001-002')
);
DELETE FROM app_transaction WHERE code IN ('PRF-002-002', 'PRF-QUIZ-002', 'STD-002-002', 'STD-001-001', 'STD-001-002');

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
    (1,'PRF-001-001','MENU_ITEM','Minhas Turmas',           '/professor/my-classes',                 1,'PRF-001'),
    (1,'PRF-001-002','MENU_ITEM','Gestão de Notas',         '/professor/grades',                     2,'PRF-001'),
    -- PROFESSOR — Fórum
    (1,'PRF-002-001','MENU_ITEM','Gerir Forum',             '/professor/forum',                      1,'PRF-002'),
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
    (1,'PRF-QUIZ-001','MENU_ITEM','Gerir Quizzes',          '/professor/quiz',                       1,'PRF-QUIZ'),
    -- PROFESSOR — Tarefas
    (1,'PRF-ASG-001','MENU_ITEM','Gerir Tarefas',           '/professor/assignments',                1,'PRF-ASG'),

    -- STUDENT — Fórum
    (1,'STD-002-001','MENU_ITEM','Forum',                   '/student/forum',                        1,'STD-002'),
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
    ('PROFESSOR','PRF-002'),    ('PROFESSOR','PRF-002-001'),
    -- PROFESSOR — biblioteca + metas
    ('PROFESSOR','PRF-LIB'),   ('PROFESSOR','PRF-LIB-001'),('PROFESSOR','PRF-LIB-002'),
    ('PROFESSOR','PRF-LIB-003'),('PROFESSOR','PRF-LIB-004'),('PROFESSOR','PRF-LIB-005'),
    ('PROFESSOR','PRF-LIB-006'),('PROFESSOR','PRF-LIB-007'),
    ('PROFESSOR','PRF-GOALS'), ('PROFESSOR','PRF-GOALS-001'),
    -- PROFESSOR — quiz + tarefas + director de turma
    ('PROFESSOR','PRF-QUIZ'),  ('PROFESSOR','PRF-QUIZ-001'),
    ('PROFESSOR','PRF-ASG'),   ('PROFESSOR','PRF-ASG-001'),
    ('PROFESSOR','PRF-DIR'),

    -- STUDENT — dashboard + fórum
    ('STUDENT','STD-001'),
    ('STUDENT','STD-002'),    ('STUDENT','STD-002-001'),
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
-- BLOCO 15 — Colunas de normalização e campos novos
-- =============================================================================
ALTER TABLE IF EXISTS ac_school      ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(500);
ALTER TABLE IF EXISTS ac_class_level ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(500);
ALTER TABLE IF EXISTS ac_class_level ADD COLUMN IF NOT EXISTS cycle           VARCHAR(10);
ALTER TABLE IF EXISTS ac_subject     ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(500);
ALTER TABLE IF EXISTS ac_subject     ADD COLUMN IF NOT EXISTS class_level_id  BIGINT;
ALTER TABLE IF EXISTS ac_subject     ADD COLUMN IF NOT EXISTS school_id       BIGINT;
ALTER TABLE IF EXISTS ac_subject     ADD COLUMN IF NOT EXISTS code            VARCHAR(20);
ALTER TABLE IF EXISTS ac_subject     ADD COLUMN IF NOT EXISTS description     VARCHAR(1000);
ALTER TABLE IF EXISTS ac_classroom   ADD COLUMN IF NOT EXISTS turma_group       VARCHAR(10);
ALTER TABLE IF EXISTS ac_classroom   ADD COLUMN IF NOT EXISTS academic_group_id BIGINT;
ALTER TABLE IF EXISTS ac_classroom   ADD COLUMN IF NOT EXISTS director_id       BIGINT;
ALTER TABLE IF EXISTS ac_classroom   ADD COLUMN IF NOT EXISTS academic_year     VARCHAR(20);

-- =============================================================================
-- BLOCO 16 — Escolas Secundárias de Nampula (apresentação — 4 escolas)
-- normalized_name deve coincidir com NampulaSchool enum (NameNormalizer.normalize)
-- =============================================================================
INSERT INTO ac_school (id, status, created_by, created_date, last_modified_by, last_modified_date,
                       name, normalized_name, city)
VALUES
(4, 1, 0, NOW(), 0, NOW(), 'Escola Secundária de Nampula',    'escola secundaria de nampula',    'Nampula'),
(5, 1, 0, NOW(), 0, NOW(), 'Escola Secundária Josina Machel', 'escola secundaria josina machel', 'Nampula'),
(6, 1, 0, NOW(), 0, NOW(), 'Escola Secundária de Napipine',   'escola secundaria de napipine',   'Nampula'),
(7, 1, 0, NOW(), 0, NOW(), 'Escola Secundária de Mutauanha',  'escola secundaria de mutauanha',  'Nampula')
ON CONFLICT (id) DO UPDATE SET
    name            = EXCLUDED.name,
    normalized_name = EXCLUDED.normalized_name,
    city            = EXCLUDED.city;

SELECT setval(pg_get_serial_sequence('ac_school', 'id'), GREATEST((SELECT MAX(id) FROM ac_school), 10));

-- =============================================================================
-- BLOCO 17 — Níveis de Ensino (5 níveis — ClassLevelDefinition)
-- Conflito por normalized_name: seguro independentemente dos IDs auto-gerados
-- =============================================================================
INSERT INTO ac_class_level (status, created_by, created_date, last_modified_by, last_modified_date,
                             name, normalized_name, cycle)
VALUES
(1, 0, NOW(), 0, NOW(), '8ª Classe',  '8 classe',  'BASICO'),
(1, 0, NOW(), 0, NOW(), '9ª Classe',  '9 classe',  'BASICO'),
(1, 0, NOW(), 0, NOW(), '10ª Classe', '10 classe', 'BASICO'),
(1, 0, NOW(), 0, NOW(), '11ª Classe', '11 classe', 'MEDIO'),
(1, 0, NOW(), 0, NOW(), '12ª Classe', '12 classe', 'MEDIO')
ON CONFLICT (normalized_name) DO UPDATE SET
    name   = EXCLUDED.name,
    cycle  = EXCLUDED.cycle,
    status = 1;

SELECT setval(pg_get_serial_sequence('ac_class_level', 'id'), GREATEST((SELECT MAX(id) FROM ac_class_level), 20));

-- =============================================================================
-- BLOCO 18 — Disciplinas ESG (19 disciplinas — CurriculumSubject)
-- IDs: Port=1 Ingl=2 Fr=3 Mat=4 Fís=5 Quím=6 Bio=7 Hist=8 Geo=9 EdFís=10
--      EdVis=11 EMC=12 TIC=13 Emp=14 Filos=15 Sociol=16 Psicol=17 EcoCont=18 DGD=19
-- =============================================================================
INSERT INTO ac_subject (id, status, created_by, created_date, last_modified_by, last_modified_date,
                         name, normalized_name)
VALUES
( 1, 1, 0, NOW(), 0, NOW(), 'Português',                                             'portugues'),
( 2, 1, 0, NOW(), 0, NOW(), 'Inglês',                                                'ingles'),
( 3, 1, 0, NOW(), 0, NOW(), 'Francês',                                               'frances'),
( 4, 1, 0, NOW(), 0, NOW(), 'Matemática',                                            'matematica'),
( 5, 1, 0, NOW(), 0, NOW(), 'Física',                                                'fisica'),
( 6, 1, 0, NOW(), 0, NOW(), 'Química',                                               'quimica'),
( 7, 1, 0, NOW(), 0, NOW(), 'Biologia',                                              'biologia'),
( 8, 1, 0, NOW(), 0, NOW(), 'História',                                              'historia'),
( 9, 1, 0, NOW(), 0, NOW(), 'Geografia',                                             'geografia'),
(10, 1, 0, NOW(), 0, NOW(), 'Educação Física',                                       'educacao fisica'),
(11, 1, 0, NOW(), 0, NOW(), 'Educação Visual',                                       'educacao visual'),
(12, 1, 0, NOW(), 0, NOW(), 'Educação Moral e Cívica',                               'educacao moral e civica'),
(13, 1, 0, NOW(), 0, NOW(), 'Introdução às Tecnologias de Informação e Comunicação', 'introducao as tecnologias de informacao e comunicacao'),
(14, 1, 0, NOW(), 0, NOW(), 'Empreendorismo',                                        'empreendorismo'),
(15, 1, 0, NOW(), 0, NOW(), 'Filosofia',                                             'filosofia'),
(16, 1, 0, NOW(), 0, NOW(), 'Sociologia',                                            'sociologia'),
(17, 1, 0, NOW(), 0, NOW(), 'Psicologia',                                            'psicologia'),
(18, 1, 0, NOW(), 0, NOW(), 'Introdução à Economia e Contabilidade',                 'introducao a economia e contabilidade'),
(19, 1, 0, NOW(), 0, NOW(), 'Desenho e Geometria Descritiva',                        'desenho e geometria descritiva')
ON CONFLICT (id) DO UPDATE SET
    name            = EXCLUDED.name,
    normalized_name = EXCLUDED.normalized_name;

SELECT setval(pg_get_serial_sequence('ac_subject', 'id'), GREATEST((SELECT MAX(id) FROM ac_subject), 25));

-- =============================================================================
-- BLOCO 19 — Grupos Académicos (2º ciclo — 4 grupos)
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

INSERT INTO ac_academic_group (id, status, created_by, created_date, last_modified_by, last_modified_date,
                                name, code, school_id)
VALUES
(1, 1, 0, NOW(), 0, NOW(), 'Grupo A — Letras',                         'A',     NULL),
(2, 1, 0, NOW(), 0, NOW(), 'Grupo B — Biologia',                       'B_BIO', NULL),
(3, 1, 0, NOW(), 0, NOW(), 'Grupo B — Geografia',                      'B_GEO', NULL),
(4, 1, 0, NOW(), 0, NOW(), 'Grupo C — Desenho e Geometria Descritiva', 'C',     NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_academic_group', 'id'), 10);

-- =============================================================================
-- BLOCO 20 — Turmas — Ano Lectivo 2025
-- ESG Nampula (id=4): 13 turmas — escola grande com todos os grupos
-- ES Josina Machel (id=5): 6 turmas — escola média
-- ES Napipine (id=6): 4 turmas — escola pequena (só 1º ciclo + 11ª Letras)
-- ES Mutauanha (id=7): 3 turmas — escola pequena (só 1º ciclo)
-- =============================================================================
ALTER TABLE IF EXISTS ac_classroom ADD COLUMN IF NOT EXISTS academic_group_id BIGINT REFERENCES ac_academic_group(id);

INSERT INTO ac_classroom (id, status, created_by, created_date, last_modified_by, last_modified_date,
                          name, school_id, class_level_id, shift, academic_year, academic_group_id)
SELECT v.id, 1, 0, NOW(), 0, NOW(), v.name, v.school_id,
       (SELECT cl.id FROM ac_class_level cl WHERE cl.normalized_name = v.cl_norm),
       v.shift, v.academic_year, v.agid
FROM (VALUES
-- ── ESG Nampula (id=4) ───────────────────────────────────────────────────────
(101, 'Turma A — 8ª Classe',          4, '8 classe',  'Manhã', '2025', NULL::BIGINT),
(102, 'Turma B — 8ª Classe',          4, '8 classe',  'Tarde', '2025', NULL::BIGINT),
(103, 'Turma A — 9ª Classe',          4, '9 classe',  'Manhã', '2025', NULL::BIGINT),
(104, 'Turma B — 9ª Classe',          4, '9 classe',  'Tarde', '2025', NULL::BIGINT),
(105, 'Turma A — 10ª Classe',         4, '10 classe', 'Manhã', '2025', NULL::BIGINT),
(106, 'Turma A — 11ª (Letras)',        4, '11 classe', 'Manhã', '2025', 1::BIGINT),
(107, 'Turma A — 11ª (Biologia)',      4, '11 classe', 'Manhã', '2025', 2::BIGINT),
(108, 'Turma A — 11ª (Geografia)',     4, '11 classe', 'Manhã', '2025', 3::BIGINT),
(109, 'Turma A — 11ª (Desenho e GD)', 4, '11 classe', 'Manhã', '2025', 4::BIGINT),
(110, 'Turma A — 12ª (Letras)',        4, '12 classe', 'Manhã', '2025', 1::BIGINT),
(111, 'Turma A — 12ª (Biologia)',      4, '12 classe', 'Manhã', '2025', 2::BIGINT),
(112, 'Turma A — 12ª (Geografia)',     4, '12 classe', 'Manhã', '2025', 3::BIGINT),
(113, 'Turma A — 12ª (Desenho e GD)', 4, '12 classe', 'Manhã', '2025', 4::BIGINT),
-- ── ES Josina Machel (id=5) ──────────────────────────────────────────────────
(121, 'Turma A — 8ª Classe',          5, '8 classe',  'Manhã', '2025', NULL::BIGINT),
(122, 'Turma A — 9ª Classe',          5, '9 classe',  'Manhã', '2025', NULL::BIGINT),
(123, 'Turma A — 10ª Classe',         5, '10 classe', 'Manhã', '2025', NULL::BIGINT),
(124, 'Turma A — 11ª (Letras)',        5, '11 classe', 'Manhã', '2025', 1::BIGINT),
(125, 'Turma A — 11ª (Biologia)',      5, '11 classe', 'Manhã', '2025', 2::BIGINT),
(126, 'Turma A — 12ª (Letras)',        5, '12 classe', 'Manhã', '2025', 1::BIGINT),
-- ── ES Napipine (id=6) ───────────────────────────────────────────────────────
(131, 'Turma A — 8ª Classe',          6, '8 classe',  'Manhã', '2025', NULL::BIGINT),
(132, 'Turma A — 9ª Classe',          6, '9 classe',  'Manhã', '2025', NULL::BIGINT),
(133, 'Turma A — 10ª Classe',         6, '10 classe', 'Manhã', '2025', NULL::BIGINT),
(134, 'Turma A — 11ª (Letras)',        6, '11 classe', 'Manhã', '2025', 1::BIGINT),
-- ── ES Mutauanha (id=7) ──────────────────────────────────────────────────────
(141, 'Turma A — 8ª Classe',          7, '8 classe',  'Manhã', '2025', NULL::BIGINT),
(142, 'Turma A — 9ª Classe',          7, '9 classe',  'Manhã', '2025', NULL::BIGINT),
(143, 'Turma A — 10ª Classe',         7, '10 classe', 'Manhã', '2025', NULL::BIGINT)
) AS v(id, name, school_id, cl_norm, shift, academic_year, agid)
ON CONFLICT (id) DO NOTHING;

-- Migração: corrigir class_level_id em turmas já existentes na BD
UPDATE ac_classroom SET class_level_id = (SELECT id FROM ac_class_level WHERE normalized_name = '11 classe') WHERE id IN (107, 108, 109, 125);
UPDATE ac_classroom SET class_level_id = (SELECT id FROM ac_class_level WHERE normalized_name = '12 classe') WHERE id IN (110, 111, 112, 113, 126);

SELECT setval(pg_get_serial_sequence('ac_classroom', 'id'), 200);

-- =============================================================================
-- BLOCO 21 — Currículo ESG (ac_class_level_subject)
-- ⚠️  Esta tabela é criada pelo Hibernate. Iniciar o serviço ≥1× antes deste bloco.
-- academic_group_id=NULL → tronco comum (todas as turmas do nível)
-- academic_group_id=1/2/3/4 → disciplinas específicas do grupo
-- =============================================================================
ALTER TABLE IF EXISTS ac_class_level_subject
    ADD COLUMN IF NOT EXISTS school_id         BIGINT REFERENCES ac_school(id);
ALTER TABLE IF EXISTS ac_class_level_subject
    ADD COLUMN IF NOT EXISTS turma_group       VARCHAR(10);
ALTER TABLE IF EXISTS ac_class_level_subject
    ADD COLUMN IF NOT EXISTS academic_group_id BIGINT REFERENCES ac_academic_group(id);

-- Migração: remover entradas de tronco duplicadas criadas pelos antigos class_levels separados por grupo
DELETE FROM ac_class_level_subject
WHERE id IN (
    1040, 1041, 1042, 1043,  -- tronco 11ª Biologia (duplica 14)
    1048, 1049, 1050, 1051,  -- tronco 11ª Geografia (duplica 14)
    1056, 1057, 1058, 1059,  -- tronco 11ª Desenho   (duplica 14)
    1072, 1073, 1074, 1075,  -- tronco 12ª Biologia  (duplica 15)
    1081, 1082, 1083, 1084,  -- tronco 12ª Geografia (duplica 15)
    1090, 1091, 1092, 1093   -- tronco 12ª Desenho   (duplica 15)
);

-- Migração: actualizar class_level_id para os grupos específicos
UPDATE ac_class_level_subject
SET class_level_id = (SELECT id FROM ac_class_level WHERE normalized_name = '11 classe')
WHERE id IN (1044, 1045, 1046, 1047,   -- 11ª Biologia → 11ª Classe
             1052, 1053, 1054, 1055,   -- 11ª Geografia → 11ª Classe
             1060, 1061, 1062);        -- 11ª Desenho   → 11ª Classe

UPDATE ac_class_level_subject
SET class_level_id = (SELECT id FROM ac_class_level WHERE normalized_name = '12 classe')
WHERE id IN (1063, 1064, 1065, 1066, 1067,        -- tronco 12ª Letras → 12ª Classe
             1068, 1069, 1070, 1071,              -- grupo 12ª Letras  → 12ª Classe
             1076, 1077, 1078, 1079, 1080,        -- grupo 12ª Biologia → 12ª Classe
             1085, 1086, 1087, 1088, 1089,        -- grupo 12ª Geografia → 12ª Classe
             1094, 1095, 1096, 1097);             -- grupo 12ª Desenho   → 12ª Classe

INSERT INTO ac_class_level_subject (id, class_level_id, subject_id, academic_group_id)
SELECT v.id,
       (SELECT cl.id FROM ac_class_level cl WHERE cl.normalized_name = v.cl_norm),
       v.subject_id, v.agid
FROM (VALUES
-- ── 8ª Classe — tronco comum ─────────────────────────────────────────────────
(1001, '8 classe',   1, NULL::BIGINT), (1002, '8 classe',   2, NULL::BIGINT), (1003, '8 classe',  4, NULL::BIGINT),
(1004, '8 classe',   7, NULL::BIGINT), (1005, '8 classe',   8, NULL::BIGINT), (1006, '8 classe',  9, NULL::BIGINT),
(1007, '8 classe',  10, NULL::BIGINT), (1008, '8 classe',  11, NULL::BIGINT), (1009, '8 classe', 12, NULL::BIGINT),
(1010, '8 classe',  13, NULL::BIGINT),
-- ── 9ª Classe — tronco comum + Empreendorismo ────────────────────────────────
(1011, '9 classe',   1, NULL::BIGINT), (1012, '9 classe',   2, NULL::BIGINT), (1013, '9 classe',  4, NULL::BIGINT),
(1014, '9 classe',   7, NULL::BIGINT), (1015, '9 classe',   8, NULL::BIGINT), (1016, '9 classe',  9, NULL::BIGINT),
(1017, '9 classe',  10, NULL::BIGINT), (1018, '9 classe',  11, NULL::BIGINT), (1019, '9 classe', 12, NULL::BIGINT),
(1020, '9 classe',  13, NULL::BIGINT), (1021, '9 classe',  14, NULL::BIGINT),
-- ── 10ª Classe — tronco comum alargado ───────────────────────────────────────
(1022, '10 classe',  1, NULL::BIGINT), (1023, '10 classe',  2, NULL::BIGINT), (1024, '10 classe',  4, NULL::BIGINT),
(1025, '10 classe',  5, NULL::BIGINT), (1026, '10 classe',  6, NULL::BIGINT), (1027, '10 classe',  7, NULL::BIGINT),
(1028, '10 classe',  8, NULL::BIGINT), (1029, '10 classe',  9, NULL::BIGINT), (1030, '10 classe', 10, NULL::BIGINT),
(1031, '10 classe', 13, NULL::BIGINT),
-- ── 11ª Classe — tronco comum ────────────────────────────────────────────────
(1032, '11 classe',  1, NULL::BIGINT), (1033, '11 classe',  2, NULL::BIGINT), (1034, '11 classe',  4, NULL::BIGINT),
(1035, '11 classe',  8, NULL::BIGINT), (1036, '11 classe', 10, NULL::BIGINT),
-- ── 11ª Classe — Grupo A Letras: Francês, Filosofia, Sociologia ──────────────
(1037, '11 classe',  3, 1::BIGINT), (1038, '11 classe', 15, 1::BIGINT), (1039, '11 classe', 16, 1::BIGINT),
-- ── 11ª Classe — Grupo B Biologia: Física, Química, Biologia, Filosofia ──────
(1044, '11 classe',  5, 2::BIGINT), (1045, '11 classe',  6, 2::BIGINT), (1046, '11 classe',  7, 2::BIGINT), (1047, '11 classe', 15, 2::BIGINT),
-- ── 11ª Classe — Grupo B Geografia: Física, Química, Geografia, Filosofia ─────
(1052, '11 classe',  5, 3::BIGINT), (1053, '11 classe',  6, 3::BIGINT), (1054, '11 classe',  9, 3::BIGINT), (1055, '11 classe', 15, 3::BIGINT),
-- ── 11ª Classe — Grupo C Desenho: Física, DGD, Filosofia ─────────────────────
(1060, '11 classe',  5, 4::BIGINT), (1061, '11 classe', 19, 4::BIGINT), (1062, '11 classe', 15, 4::BIGINT),
-- ── 12ª Classe — tronco comum ────────────────────────────────────────────────
(1063, '12 classe',  1, NULL::BIGINT), (1064, '12 classe',  2, NULL::BIGINT), (1065, '12 classe',  4, NULL::BIGINT),
(1066, '12 classe',  8, NULL::BIGINT), (1067, '12 classe', 10, NULL::BIGINT),
-- ── 12ª Classe — Grupo A Letras: Francês, Filosofia, Sociologia, Psicologia ──
(1068, '12 classe',  3, 1::BIGINT), (1069, '12 classe', 15, 1::BIGINT), (1070, '12 classe', 16, 1::BIGINT), (1071, '12 classe', 17, 1::BIGINT),
-- ── 12ª Classe — Grupo B Biologia: Física, Química, Bio, Filosofia, Psicologia
(1076, '12 classe',  5, 2::BIGINT), (1077, '12 classe',  6, 2::BIGINT), (1078, '12 classe',  7, 2::BIGINT), (1079, '12 classe', 15, 2::BIGINT), (1080, '12 classe', 17, 2::BIGINT),
-- ── 12ª Classe — Grupo B Geografia: Física, Química, Geo, Filosofia, Psicologia
(1085, '12 classe',  5, 3::BIGINT), (1086, '12 classe',  6, 3::BIGINT), (1087, '12 classe',  9, 3::BIGINT), (1088, '12 classe', 15, 3::BIGINT), (1089, '12 classe', 17, 3::BIGINT),
-- ── 12ª Classe — Grupo C Desenho: Física, DGD, Filosofia, Psicologia ─────────
(1094, '12 classe',  5, 4::BIGINT), (1095, '12 classe', 19, 4::BIGINT), (1096, '12 classe', 15, 4::BIGINT), (1097, '12 classe', 17, 4::BIGINT)
) AS v(id, cl_norm, subject_id, agid)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('ac_class_level_subject', 'id'), 2000);

-- =============================================================================
-- BLOCO 22 — Perfil do professor: ciclo de ensino
-- =============================================================================
ALTER TABLE IF EXISTS professor_profile
    ADD COLUMN IF NOT EXISTS teaching_cycle VARCHAR(10);

-- =============================================================================
-- BLOCO 23 — Actualizar estudante de teste para a 10ª Classe (ESG Nampula)
-- Login: +258841111101
-- =============================================================================
UPDATE student_profile
SET classroom_id = 105, school_id = 4, grade = '10ª Classe'
WHERE user_id = (SELECT id FROM sae_user WHERE username = '+258841111101');

-- =============================================================================
-- BLOCO 24 — Quiz: migração de disciplina (enum) → subject_id (FK académico)
-- =============================================================================
ALTER TABLE IF EXISTS quiz
    ALTER COLUMN disciplina DROP NOT NULL;
ALTER TABLE IF EXISTS quiz
    ADD COLUMN IF NOT EXISTS subject_id   BIGINT;
ALTER TABLE IF EXISTS quiz
    ADD COLUMN IF NOT EXISTS subject_name VARCHAR(200);

-- =============================================================================
-- BLOCO 25 — Professor: fluxo de aprovação
-- =============================================================================
ALTER TABLE professor_profile
    ADD COLUMN IF NOT EXISTS approval_status    VARCHAR(20)  NOT NULL DEFAULT 'APPROVED';
ALTER TABLE professor_profile
    ADD COLUMN IF NOT EXISTS rejection_reason   VARCHAR(500);
ALTER TABLE professor_profile
    ADD COLUMN IF NOT EXISTS id_document_number VARCHAR(50);

UPDATE professor_profile SET approval_status = 'APPROVED' WHERE approval_status IS NULL OR approval_status = '';

-- =============================================================================
-- BLOCO 26 — Certificados de apoio de professor
-- =============================================================================
CREATE TABLE IF NOT EXISTS professor_certificate (
    id                     BIGSERIAL        PRIMARY KEY,
    professor_username     VARCHAR(256)     NOT NULL,
    discipline             VARCHAR(256)     NOT NULL,
    assistance_percentage  DOUBLE PRECISION NOT NULL,
    total_answered         BIGINT           NOT NULL DEFAULT 0,
    is_public              BOOLEAN          NOT NULL DEFAULT FALSE,
    issued_at              TIMESTAMP        NOT NULL DEFAULT NOW(),
    published_at           TIMESTAMP,
    UNIQUE (professor_username, discipline)
);

-- =============================================================================
-- BLOCO 27 — Menu: Dashboard, Fórum e Relatórios para ADMIN; Certificados PROFESSOR
-- =============================================================================
INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id) VALUES
(1, 'ADM-DASH',  'HEADER', 'Dashboard',   '/admin/dashboard', 0, NULL),
(1, 'ADM-FORUM', 'HEADER', 'Fórum',        '/admin/forum',    5, NULL),
(1, 'ADM-RPT',   'HEADER', 'Relatórios',   '/admin/reports',  6, NULL),
(1, 'PRF-CERT',  'HEADER', 'Certificados', '/professor/certificates', 8, NULL)
ON CONFLICT (code) DO UPDATE SET
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position;

INSERT INTO app_transaction (status, code, type, label, router_link, position, parent_id)
SELECT v.status, v.code, v.type, v.label, v.router_link, v.position,
       (SELECT id FROM app_transaction WHERE code = v.parent_code)
FROM (VALUES
    (1,'ADM-DASH-001', 'MENU_ITEM','Visão Geral',              '/admin/dashboard',               1,'ADM-DASH'),
    (1,'ADM-FORUM-001','MENU_ITEM','Ver Fórum',                '/admin/forum',                   1,'ADM-FORUM'),
    (1,'ADM-RPT-001',  'MENU_ITEM','Relatório de Atendimento', '/admin/reports',                 1,'ADM-RPT'),
    (1,'PRF-CERT-001', 'MENU_ITEM','Os Meus Certificados',     '/professor/certificates',        1,'PRF-CERT'),
    (1,'PRF-LIB-008',  'MENU_ITEM','Sugerir Leitura',          '/professor/library/suggest',     8,'PRF-LIB'),
    (1,'STD-LIB-007',  'MENU_ITEM','Sugestões de Leitura',     '/student/library/suggestions',   7,'STD-LIB')
) AS v(status, code, type, label, router_link, position, parent_code)
ON CONFLICT (code) DO UPDATE SET
    label       = EXCLUDED.label,
    router_link = EXCLUDED.router_link,
    position    = EXCLUDED.position,
    parent_id   = EXCLUDED.parent_id;

INSERT INTO role_transaction (status, role, app_transaction_id)
SELECT 1, v.role, a.id
FROM (VALUES
    ('ADMIN','ADM-DASH'),        ('ADMIN','ADM-DASH-001'),
    ('ADMIN','ADM-FORUM'),       ('ADMIN','ADM-FORUM-001'),
    ('ADMIN','ADM-RPT'),         ('ADMIN','ADM-RPT-001'),
    ('SCHOOL_ADMIN','ADM-DASH'), ('SCHOOL_ADMIN','ADM-DASH-001'),
    ('SCHOOL_ADMIN','ADM-FORUM'),('SCHOOL_ADMIN','ADM-FORUM-001'),
    ('SCHOOL_ADMIN','ADM-RPT'),  ('SCHOOL_ADMIN','ADM-RPT-001'),
    ('PROFESSOR','PRF-CERT'),    ('PROFESSOR','PRF-CERT-001'),
    ('PROFESSOR','PRF-LIB-008'),
    ('STUDENT','STD-LIB-007')
) AS v(role, tx_code)
JOIN app_transaction a ON a.code = v.tx_code
ON CONFLICT (role, app_transaction_id) DO NOTHING;

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
SELECT 'app_transaction'       AS tabela, COUNT(*) AS total FROM app_transaction
UNION ALL SELECT 'role_transaction',      COUNT(*) FROM role_transaction
UNION ALL SELECT 'ac_school',             COUNT(*) FROM ac_school
UNION ALL SELECT 'ac_class_level',        COUNT(*) FROM ac_class_level
UNION ALL SELECT 'ac_subject',            COUNT(*) FROM ac_subject
UNION ALL SELECT 'ac_academic_group',     COUNT(*) FROM ac_academic_group
UNION ALL SELECT 'ac_classroom',          COUNT(*) FROM ac_classroom;

-- =============================================================================
-- BLOCO 28 — Coluna must_change_password em sae_user (safe re-run)
-- =============================================================================
ALTER TABLE sae_user ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
