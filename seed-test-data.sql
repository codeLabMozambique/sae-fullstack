-- =============================================================================
-- SAE — SEED DE DADOS DE TESTE (apresentação)
-- ESG Nampula (school_id=4): 9 alunos × 9 turmas + 10 professores
-- Pré-requisito: serviços iniciados ≥1× E seed.sql executado
-- Senha uniforme: SAE@2025!
-- IDs de turma: 101-113 (ESG Nampula)
-- IDs de disciplina: Port=1 Ingl=2 Fr=3 Mat=4 Fís=5 Quím=6 Bio=7 Hist=8
--                    Geo=9 EdFís=10 TIC=13 Filos=15 Sociol=16 Psicol=17
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- SECÇÃO 1 — UTILIZADORES ESTUDANTE — ESG Nampula (school_id=4)
-- 9 turmas × 9 alunos = 81 alunos
-- =============================================================================

WITH std_role AS (SELECT id FROM role_transaction WHERE role = 'STUDENT' LIMIT 1)
INSERT INTO sae_user (
    status, created_by, created_date, last_modified_by, last_modified_date,
    username, email, password, full_name, enabled, must_change_password, roleT_id
)
SELECT 1, 0, NOW(), 0, NOW(),
       v.username, v.email,
       crypt('SAE@2025!', gen_salt('bf')),
       v.full_name, true, false, r.id
FROM (VALUES
    -- ── Turma 101 — 8ª Classe Manhã ─────────────────────────────────────────
    ('+258840101001','armindo.sitoe@esn.edu.mz',        'Armindo Manuel Sitoe'),
    ('+258840101002','beatriz.fumo@esn.edu.mz',         'Beatriz Conceição Fumo'),
    ('+258840101003','carlos.nhaca@esn.edu.mz',         'Carlos Eduardo Nhaca'),
    ('+258840101004','dina.cossa@esn.edu.mz',           'Dina Amélia Cossa'),
    ('+258840101005','ernesto.mabjaia@esn.edu.mz',      'Ernesto Filipe Mabjaia'),
    ('+258840101006','felicidade.mabunda@esn.edu.mz',   'Felicidade António Mabunda'),
    ('+258840101007','gabriel.machava@esn.edu.mz',      'Gabriel Domingos Machava'),
    ('+258840101008','helena.mahlombe@esn.edu.mz',      'Helena Júlia Mahlombe'),
    ('+258840101009','isaque.guambe@esn.edu.mz',        'Isaque Nunes Guambe'),
    -- ── Turma 103 — 9ª Classe Manhã ─────────────────────────────────────────
    ('+258840103001','jacinto.mondlane@esn.edu.mz',     'Jacinto Paulo Mondlane'),
    ('+258840103002','keiti.libombo@esn.edu.mz',        'Keiti Artur Libombo'),
    ('+258840103003','lourenco.sitoe@esn.edu.mz',       'Lourenço Virgílio Sitoe'),
    ('+258840103004','marta.nhambe@esn.edu.mz',         'Marta Filomena Nhambe'),
    ('+258840103005','narciso.cuna@esn.edu.mz',         'Narciso Damiano Cuna'),
    ('+258840103006','olinda.macandja@esn.edu.mz',      'Olinda Sofia Macandja'),
    ('+258840103007','placido.zita@esn.edu.mz',         'Plácido Ernesto Zita'),
    ('+258840103008','raquel.nhampossa@esn.edu.mz',     'Raquel Julieta Nhampossa'),
    ('+258840103009','sebastiao.chuele@esn.edu.mz',     'Sebastião Alberto Chuele'),
    -- ── Turma 105 — 10ª Classe Manhã ────────────────────────────────────────
    ('+258840105001','tomas.zunguze@esn.edu.mz',        'Tomás Fernando Zunguze'),
    ('+258840105002','ursulina.chirindza@esn.edu.mz',   'Ursulina Bento Chirindza'),
    ('+258840105003','valentim.nhanombe@esn.edu.mz',    'Valentim Júlio Nhanombe'),
    ('+258840105004','wanda.macuacua@esn.edu.mz',       'Wanda Emília Macuácua'),
    ('+258840105005','xisto.manhique@esn.edu.mz',       'Xisto Luciano Manhique'),
    ('+258840105006','yolanda.nhabite@esn.edu.mz',      'Yolanda Filipe Nhabite'),
    ('+258840105007','zacarias.vilanculo@esn.edu.mz',   'Zacarias Álvaro Vilanculo'),
    ('+258840105008','anabeatriz.mussane@esn.edu.mz',   'Ana Beatriz Mussane'),
    ('+258840105009','bruno.cumbe@esn.edu.mz',          'Bruno Celestino Cumbe'),
    -- ── Turma 106 — 11ª Classe (Letras) ─────────────────────────────────────
    ('+258840106001','celeste.guirrugo@esn.edu.mz',     'Celeste Dionísio Guirrugo'),
    ('+258840106002','david.amade@esn.edu.mz',          'David Justino Amade'),
    ('+258840106003','estela.tembe@esn.edu.mz',         'Estela Rodrigues Tembe'),
    ('+258840106004','fausto.chabala@esn.edu.mz',       'Fausto Lúcio Chabala'),
    ('+258840106005','gloria.mondlane@esn.edu.mz',      'Glória Maria Mondlane'),
    ('+258840106006','helio.sitoe@esn.edu.mz',          'Hélio Cristóvão Sitoe'),
    ('+258840106007','ines.machava@esn.edu.mz',         'Inês Patrícia Machava'),
    ('+258840106008','joao.fumo@esn.edu.mz',            'João Domingos Fumo'),
    ('+258840106009','lucia.nhaca@esn.edu.mz',          'Lúcia Fernanda Nhaca'),
    -- ── Turma 107 — 11ª Classe (Biologia) ───────────────────────────────────
    ('+258840107001','mario.cossa@esn.edu.mz',          'Mário Esperança Cossa'),
    ('+258840107002','natalia.mabjaia@esn.edu.mz',      'Natália Guido Mabjaia'),
    ('+258840107003','osvaldo.mabunda@esn.edu.mz',      'Osvaldo Teófilo Mabunda'),
    ('+258840107004','paula.libombo@esn.edu.mz',        'Paula Cecília Libombo'),
    ('+258840107005','quintino.nhambe@esn.edu.mz',      'Quintino Elias Nhambe'),
    ('+258840107006','rosa.cuna@esn.edu.mz',            'Rosa Albertina Cuna'),
    ('+258840107007','simao.macandja@esn.edu.mz',       'Simão Baltazar Macandja'),
    ('+258840107008','teresa.zita@esn.edu.mz',          'Teresa Cândida Zita'),
    ('+258840107009','ulisses.nhampossa@esn.edu.mz',    'Ulisses Benigno Nhampossa'),
    -- ── Turma 109 — 11ª Classe (Desenho e GD) ───────────────────────────────
    ('+258840109001','vania.chuele@esn.edu.mz',         'Vânia Gertrudes Chuele'),
    ('+258840109002','walter.zunguze@esn.edu.mz',       'Walter Hipólito Zunguze'),
    ('+258840109003','xenia.chirindza@esn.edu.mz',      'Xénia Irene Chirindza'),
    ('+258840109004','yanis.nhanombe@esn.edu.mz',       'Yanis Joaquim Nhanombe'),
    ('+258840109005','zilda.macuacua@esn.edu.mz',       'Zilda Kátia Macuácua'),
    ('+258840109006','alberto.manhique@esn.edu.mz',     'Alberto Lázaro Manhique'),
    ('+258840109007','belmira.nhabite@esn.edu.mz',      'Belmira Maurício Nhabite'),
    ('+258840109008','claudio.vilanculo@esn.edu.mz',    'Cláudio Nicolau Vilanculo'),
    ('+258840109009','deolinda.mussane@esn.edu.mz',     'Deolinda Osvaldo Mussane'),
    -- ── Turma 110 — 12ª Classe (Letras) ─────────────────────────────────────
    ('+258840110001','eduardo.cumbe@esn.edu.mz',        'Eduardo Paulo Cumbe'),
    ('+258840110002','filomena.guirrugo@esn.edu.mz',    'Filomena Quirino Guirrugo'),
    ('+258840110003','geraldo.amade@esn.edu.mz',        'Geraldo Rosário Amade'),
    ('+258840110004','hermelinda.tembe@esn.edu.mz',     'Hermelinda Sérgio Tembe'),
    ('+258840110005','ilidio.chabala@esn.edu.mz',       'Ilídio Teotônio Chabala'),
    ('+258840110006','josefina.mondlane@esn.edu.mz',    'Josefina Ubaldo Mondlane'),
    ('+258840110007','leopoldo.sitoe@esn.edu.mz',       'Leopoldo Valentim Sitoe'),
    ('+258840110008','madalena.machava@esn.edu.mz',     'Madalena Waldemar Machava'),
    ('+258840110009','noel.fumo@esn.edu.mz',            'Noel Xavier Fumo'),
    -- ── Turma 111 — 12ª Classe (Biologia) ───────────────────────────────────
    ('+258840111001','olavo.nhaca@esn.edu.mz',          'Olavo Yolanda Nhaca'),
    ('+258840111002','perpetua.cossa@esn.edu.mz',       'Perpétua Zacarias Cossa'),
    ('+258840111003','quiteria.mabjaia@esn.edu.mz',     'Quitéria Adriano Mabjaia'),
    ('+258840111004','rodolfo.mabunda@esn.edu.mz',      'Rodolfo Bernardino Mabunda'),
    ('+258840111005','salome.libombo@esn.edu.mz',       'Salomé Cipriano Libombo'),
    ('+258840111006','tobias.nhambe@esn.edu.mz',        'Tobias Dário Nhambe'),
    ('+258840111007','umbelina.cuna@esn.edu.mz',        'Umbelina Euclides Cuna'),
    ('+258840111008','vitorino.macandja@esn.edu.mz',    'Vitorino Florêncio Macandja'),
    ('+258840111009','wandac.zita@esn.edu.mz',          'Wanda Graciano Zita'),
    -- ── Turma 113 — 12ª Classe (Desenho e GD) ───────────────────────────────
    ('+258840113001','ximena.nhampossa@esn.edu.mz',     'Ximena Hortêncio Nhampossa'),
    ('+258840113002','yolandai.chuele@esn.edu.mz',      'Yolanda Ilídio Chuele'),
    ('+258840113003','zaqueu.zunguze@esn.edu.mz',       'Zaqueu Januário Zunguze'),
    ('+258840113004','americo.chirindza@esn.edu.mz',    'Américo Lopes Chirindza'),
    ('+258840113005','benedita.nhanombe@esn.edu.mz',    'Benedita Mariana Nhanombe'),
    ('+258840113006','celestino.macuacua@esn.edu.mz',   'Celestino Nuno Macuácua'),
    ('+258840113007','domingas.manhique@esn.edu.mz',    'Domingas Onésimo Manhique'),
    ('+258840113008','ernani.nhabite@esn.edu.mz',       'Ernâni Policarpo Nhabite'),
    ('+258840113009','francisca.vilanculo@esn.edu.mz',  'Francisca Quirino Vilanculo')
) AS v(username, email, full_name)
CROSS JOIN std_role r
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- SECÇÃO 2 — PERFIS ESTUDANTE — ESG Nampula
-- =============================================================================

-- ── Turma 101 — 8ª Classe ────────────────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 101, '8ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840101001' THEN 13 WHEN '+258840101002' THEN 14 WHEN '+258840101003' THEN 13
        WHEN '+258840101004' THEN 14 WHEN '+258840101005' THEN 13 WHEN '+258840101006' THEN 14
        WHEN '+258840101007' THEN 13 WHEN '+258840101008' THEN 14 WHEN '+258840101009' THEN 13
    END
FROM sae_user u WHERE u.username IN (
    '+258840101001','+258840101002','+258840101003','+258840101004','+258840101005',
    '+258840101006','+258840101007','+258840101008','+258840101009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 103 — 9ª Classe ────────────────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 103, '9ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840103001' THEN 14 WHEN '+258840103002' THEN 15 WHEN '+258840103003' THEN 14
        WHEN '+258840103004' THEN 15 WHEN '+258840103005' THEN 14 WHEN '+258840103006' THEN 15
        WHEN '+258840103007' THEN 14 WHEN '+258840103008' THEN 15 WHEN '+258840103009' THEN 14
    END
FROM sae_user u WHERE u.username IN (
    '+258840103001','+258840103002','+258840103003','+258840103004','+258840103005',
    '+258840103006','+258840103007','+258840103008','+258840103009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 105 — 10ª Classe ───────────────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 105, '10ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840105001' THEN 15 WHEN '+258840105002' THEN 16 WHEN '+258840105003' THEN 15
        WHEN '+258840105004' THEN 16 WHEN '+258840105005' THEN 15 WHEN '+258840105006' THEN 16
        WHEN '+258840105007' THEN 15 WHEN '+258840105008' THEN 16 WHEN '+258840105009' THEN 15
    END
FROM sae_user u WHERE u.username IN (
    '+258840105001','+258840105002','+258840105003','+258840105004','+258840105005',
    '+258840105006','+258840105007','+258840105008','+258840105009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 106 — 11ª Classe (Letras) ──────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 106, '11ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840106001' THEN 16 WHEN '+258840106002' THEN 17 WHEN '+258840106003' THEN 16
        WHEN '+258840106004' THEN 17 WHEN '+258840106005' THEN 16 WHEN '+258840106006' THEN 17
        WHEN '+258840106007' THEN 16 WHEN '+258840106008' THEN 17 WHEN '+258840106009' THEN 16
    END
FROM sae_user u WHERE u.username IN (
    '+258840106001','+258840106002','+258840106003','+258840106004','+258840106005',
    '+258840106006','+258840106007','+258840106008','+258840106009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 107 — 11ª Classe (Biologia) ────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 107, '11ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840107001' THEN 16 WHEN '+258840107002' THEN 17 WHEN '+258840107003' THEN 16
        WHEN '+258840107004' THEN 17 WHEN '+258840107005' THEN 16 WHEN '+258840107006' THEN 17
        WHEN '+258840107007' THEN 16 WHEN '+258840107008' THEN 17 WHEN '+258840107009' THEN 16
    END
FROM sae_user u WHERE u.username IN (
    '+258840107001','+258840107002','+258840107003','+258840107004','+258840107005',
    '+258840107006','+258840107007','+258840107008','+258840107009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 109 — 11ª Classe (Desenho e GD) ────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 109, '11ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840109001' THEN 16 WHEN '+258840109002' THEN 17 WHEN '+258840109003' THEN 16
        WHEN '+258840109004' THEN 17 WHEN '+258840109005' THEN 16 WHEN '+258840109006' THEN 17
        WHEN '+258840109007' THEN 16 WHEN '+258840109008' THEN 17 WHEN '+258840109009' THEN 16
    END
FROM sae_user u WHERE u.username IN (
    '+258840109001','+258840109002','+258840109003','+258840109004','+258840109005',
    '+258840109006','+258840109007','+258840109008','+258840109009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 110 — 12ª Classe (Letras) ──────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 110, '12ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840110001' THEN 17 WHEN '+258840110002' THEN 18 WHEN '+258840110003' THEN 17
        WHEN '+258840110004' THEN 18 WHEN '+258840110005' THEN 17 WHEN '+258840110006' THEN 18
        WHEN '+258840110007' THEN 17 WHEN '+258840110008' THEN 18 WHEN '+258840110009' THEN 17
    END
FROM sae_user u WHERE u.username IN (
    '+258840110001','+258840110002','+258840110003','+258840110004','+258840110005',
    '+258840110006','+258840110007','+258840110008','+258840110009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 111 — 12ª Classe (Biologia) ────────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 111, '12ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840111001' THEN 17 WHEN '+258840111002' THEN 18 WHEN '+258840111003' THEN 17
        WHEN '+258840111004' THEN 18 WHEN '+258840111005' THEN 17 WHEN '+258840111006' THEN 18
        WHEN '+258840111007' THEN 17 WHEN '+258840111008' THEN 18 WHEN '+258840111009' THEN 17
    END
FROM sae_user u WHERE u.username IN (
    '+258840111001','+258840111002','+258840111003','+258840111004','+258840111005',
    '+258840111006','+258840111007','+258840111008','+258840111009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 113 — 12ª Classe (Desenho e GD) ────────────────────────────────────
INSERT INTO student_profile (status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 113, '12ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840113001' THEN 17 WHEN '+258840113002' THEN 18 WHEN '+258840113003' THEN 17
        WHEN '+258840113004' THEN 18 WHEN '+258840113005' THEN 17 WHEN '+258840113006' THEN 18
        WHEN '+258840113007' THEN 17 WHEN '+258840113008' THEN 18 WHEN '+258840113009' THEN 17
    END
FROM sae_user u WHERE u.username IN (
    '+258840113001','+258840113002','+258840113003','+258840113004','+258840113005',
    '+258840113006','+258840113007','+258840113008','+258840113009'
) AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- =============================================================================
-- SECÇÃO 3 — UTILIZADORES PROFESSOR — ESG Nampula (10 professores)
-- Cada professor cobre a sua disciplina em múltiplas turmas
-- =============================================================================

WITH prf_role AS (SELECT id FROM role_transaction WHERE role = 'PROFESSOR' LIMIT 1)
INSERT INTO sae_user (
    status, created_by, created_date, last_modified_by, last_modified_date,
    username, email, password, full_name, enabled, must_change_password, roleT_id
)
SELECT 1, 0, NOW(), 0, NOW(),
       v.username, v.email,
       crypt('SAE@2025!', gen_salt('bf')),
       v.full_name, true, false, r.id
FROM (VALUES
    ('+258850011001', 'joao.tembe@esn.edu.mz',        'João António Tembe'),
    ('+258850011002', 'ana.chirindza@esn.edu.mz',     'Ana Paula Chirindza'),
    ('+258850011003', 'pedro.guambe@esn.edu.mz',      'Pedro Augusto Guambe'),
    ('+258850011004', 'rosa.libombo@esn.edu.mz',      'Rosa Elvira Libombo'),
    ('+258850011005', 'maria.mondlane@esn.edu.mz',    'Maria Isabel Mondlane'),
    ('+258850011006', 'fatima.nhanombe@esn.edu.mz',   'Fátima Rosária Nhanombe'),
    ('+258850011007', 'david.ferreira@esn.edu.mz',    'David Carlos Ferreira'),
    ('+258850011008', 'manuel.sitoe@esn.edu.mz',      'Manuel Sérgio Sitoe'),
    ('+258850011009', 'carlos.machava@esn.edu.mz',    'Carlos José Machava'),
    ('+258850011010', 'amelia.macuacua@esn.edu.mz',   'Amélia Graça Macuácua')
) AS v(username, email, full_name)
CROSS JOIN prf_role r
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- SECÇÃO 4 — PERFIS PROFESSOR — ESG Nampula
-- =============================================================================

INSERT INTO professor_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, department, specialization, professor_code,
    teaching_cycle, approval_status, is_online
)
SELECT 1, 0, NOW(), 0, NOW(),
       u.id, 4, v.department, v.specialization, v.prof_code,
       v.cycle, 'APPROVED', false
FROM (VALUES
    ('+258850011001', 'Ciências Exactas',  'Matemática',                      'PRF-MAT-001',   'AMBOS'),
    ('+258850011002', 'Línguas',           'Português',                       'PRF-PORT-001',  'AMBOS'),
    ('+258850011003', 'Ciências Naturais', 'Física',                          'PRF-FIS-001',   'MEDIO'),
    ('+258850011004', 'Ciências Naturais', 'Química',                         'PRF-QUIM-001',  'MEDIO'),
    ('+258850011005', 'Ciências Sociais',  'História',                        'PRF-HIST-001',  'AMBOS'),
    ('+258850011006', 'Ciências Naturais', 'Biologia',                        'PRF-BIO-001',   'AMBOS'),
    ('+258850011007', 'Línguas',           'Inglês',                          'PRF-INGL-001',  'AMBOS'),
    ('+258850011008', 'Tecnologias',       'Introdução às TIC',               'PRF-TIC-001',   'BASICO'),
    ('+258850011009', 'Ciências Sociais',  'Geografia',                       'PRF-GEO-001',   'AMBOS'),
    ('+258850011010', 'Humanidades',       'Filosofia',                       'PRF-FILOS-001', 'MEDIO')
) AS v(username, department, specialization, prof_code, cycle)
JOIN sae_user u ON u.username = v.username
WHERE NOT EXISTS (SELECT 1 FROM professor_profile WHERE user_id = u.id);

-- =============================================================================
-- SECÇÃO 5 — ATRIBUIÇÕES PROFESSOR → TURMA → DISCIPLINA (ESG Nampula)
--
-- Disciplinas (IDs actualizados):
--   Port=1, Ingl=2, Fr=3, Mat=4, Fís=5, Quím=6, Bio=7, Hist=8, Geo=9
--   TIC=13, Filos=15, Sociol=16
--
-- Turmas ESG Nampula:
--   101=8ªA, 103=9ªA, 105=10ªA
--   106=11ªLetras, 107=11ªBio, 108=11ªGeo, 109=11ªDesenho
--   110=12ªLetras, 111=12ªBio, 112=12ªGeo, 113=12ªDesenho
-- =============================================================================

INSERT INTO ac_professor_assignment (
    status, created_by, created_date, last_modified_by, last_modified_date,
    professor_id, classroom_id, subject_id
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, v.classroom_id, v.subject_id
FROM (VALUES
    -- ── Prof. Matemática (+258850011001) — sub_id=4 ──────────────────────────
    ('+258850011001', 101, 4), ('+258850011001', 103, 4), ('+258850011001', 105, 4),
    ('+258850011001', 106, 4), ('+258850011001', 107, 4),
    -- ── Prof. Português (+258850011002) — sub_id=1 ───────────────────────────
    ('+258850011002', 101, 1), ('+258850011002', 104, 1),
    ('+258850011002', 108, 1), ('+258850011002', 110, 1), ('+258850011002', 112, 1),
    -- ── Prof. Física (+258850011003) — sub_id=5 ──────────────────────────────
    ('+258850011003', 105, 5), ('+258850011003', 107, 5),
    ('+258850011003', 108, 5), ('+258850011003', 109, 5), ('+258850011003', 111, 5),
    -- ── Prof. Química (+258850011004) — sub_id=6 ─────────────────────────────
    ('+258850011004', 107, 6), ('+258850011004', 108, 6),
    ('+258850011004', 111, 6), ('+258850011004', 112, 6), ('+258850011004', 113, 6),
    -- ── Prof. História (+258850011005) — sub_id=8 ────────────────────────────
    ('+258850011005', 101, 8), ('+258850011005', 103, 8),
    ('+258850011005', 106, 8), ('+258850011005', 110, 8),
    -- ── Prof. Biologia (+258850011006) — sub_id=7 ────────────────────────────
    ('+258850011006', 103, 7), ('+258850011006', 105, 7),
    ('+258850011006', 107, 7), ('+258850011006', 111, 7),
    -- ── Prof. Inglês (+258850011007) — sub_id=2 ──────────────────────────────
    ('+258850011007', 102, 2), ('+258850011007', 104, 2),
    ('+258850011007', 109, 2), ('+258850011007', 110, 2), ('+258850011007', 113, 2),
    -- ── Prof. TIC (+258850011008) — sub_id=13 ────────────────────────────────
    ('+258850011008', 101, 13), ('+258850011008', 103, 13), ('+258850011008', 105, 13),
    -- ── Prof. Geografia (+258850011009) — sub_id=9 ───────────────────────────
    ('+258850011009', 101, 9), ('+258850011009', 103, 9),
    ('+258850011009', 108, 9), ('+258850011009', 112, 9),
    -- ── Prof. Filosofia (+258850011010) — sub_id=15 ──────────────────────────
    ('+258850011010', 106, 15), ('+258850011010', 107, 15),
    ('+258850011010', 108, 15), ('+258850011010', 109, 15),
    ('+258850011010', 110, 15), ('+258850011010', 111, 15),
    ('+258850011010', 112, 15), ('+258850011010', 113, 15)
) AS v(username, classroom_id, subject_id)
JOIN sae_user u ON u.username = v.username
WHERE NOT EXISTS (
    SELECT 1 FROM ac_professor_assignment pa
    WHERE pa.professor_id = u.id
      AND pa.classroom_id = v.classroom_id
      AND pa.subject_id   = v.subject_id
);

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
SELECT 'sae_user (STUDENT)'      AS tabela, COUNT(*) AS total
  FROM sae_user u JOIN role_transaction rt ON u.roleT_id = rt.id WHERE rt.role = 'STUDENT'
UNION ALL
SELECT 'sae_user (PROFESSOR)',    COUNT(*)
  FROM sae_user u JOIN role_transaction rt ON u.roleT_id = rt.id WHERE rt.role = 'PROFESSOR'
UNION ALL
SELECT 'student_profile',         COUNT(*) FROM student_profile
UNION ALL
SELECT 'professor_profile',       COUNT(*) FROM professor_profile
UNION ALL
SELECT 'ac_professor_assignment', COUNT(*) FROM ac_professor_assignment;
