-- =============================================================================
-- SAE — SEED DE DADOS DE TESTE
-- Escola Secundária SAE (school_id=4): 9 alunos × 9 turmas + 10 professores
-- Universidades (UEM, UP): 9 alunos × turmas existentes (IDs por subquery)
-- Executar: psql -U postgres -d sae_db -f seed-test-data.sql
-- Seguro para re-execução (ON CONFLICT DO NOTHING / WHERE NOT EXISTS)
-- Pré-requisito: todos os serviços iniciados ≥1× (tabelas JPA criadas)
-- Senha uniforme para todos os utilizadores gerados: SAE@2025!
-- NOTA: Este script apenas insere dados de teste — não altera lógica nem schema.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- SECÇÃO 1 — UTILIZADORES ESTUDANTE — Escola Secundária SAE
-- Formato de telefone: +25884002CC0N  (CC=classroom_id, N=sequência 1-9)
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
    -- ── Turma 21 — 8ª Classe ────────────────────────────────────────────
    ('+258840021001','armindo.sitoe@esg.edu.mz',        'Armindo Manuel Sitoe'),
    ('+258840021002','beatriz.fumo@esg.edu.mz',         'Beatriz Conceição Fumo'),
    ('+258840021003','carlos.nhaca@esg.edu.mz',         'Carlos Eduardo Nhaca'),
    ('+258840021004','dina.cossa@esg.edu.mz',           'Dina Amélia Cossa'),
    ('+258840021005','ernesto.mabjaia@esg.edu.mz',      'Ernesto Filipe Mabjaia'),
    ('+258840021006','felicidade.mabunda@esg.edu.mz',   'Felicidade António Mabunda'),
    ('+258840021007','gabriel.machava@esg.edu.mz',      'Gabriel Domingos Machava'),
    ('+258840021008','helena.mahlombe@esg.edu.mz',      'Helena Júlia Mahlombe'),
    ('+258840021009','isaque.guambe@esg.edu.mz',        'Isaque Nunes Guambe'),
    -- ── Turma 22 — 9ª Classe ────────────────────────────────────────────
    ('+258840022001','jacinto.mondlane@esg.edu.mz',     'Jacinto Paulo Mondlane'),
    ('+258840022002','keiti.libombo@esg.edu.mz',        'Keiti Artur Libombo'),
    ('+258840022003','lourenco.sitoe@esg.edu.mz',       'Lourenço Virgílio Sitoe'),
    ('+258840022004','marta.nhambe@esg.edu.mz',         'Marta Filomena Nhambe'),
    ('+258840022005','narciso.cuna@esg.edu.mz',         'Narciso Damiano Cuna'),
    ('+258840022006','olinda.macandja@esg.edu.mz',      'Olinda Sofia Macandja'),
    ('+258840022007','placido.zita@esg.edu.mz',         'Plácido Ernesto Zita'),
    ('+258840022008','raquel.nhampossa@esg.edu.mz',     'Raquel Julieta Nhampossa'),
    ('+258840022009','sebastiao.chuele@esg.edu.mz',     'Sebastião Alberto Chuele'),
    -- ── Turma 23 — 10ª Classe ───────────────────────────────────────────
    ('+258840023001','tomas.zunguze@esg.edu.mz',        'Tomás Fernando Zunguze'),
    ('+258840023002','ursulina.chirindza@esg.edu.mz',   'Ursulina Bento Chirindza'),
    ('+258840023003','valentim.nhanombe@esg.edu.mz',    'Valentim Júlio Nhanombe'),
    ('+258840023004','wanda.macuacua@esg.edu.mz',       'Wanda Emília Macuácua'),
    ('+258840023005','xisto.manhique@esg.edu.mz',       'Xisto Luciano Manhique'),
    ('+258840023006','yolanda.nhabite@esg.edu.mz',      'Yolanda Filipe Nhabite'),
    ('+258840023007','zacarias.vilanculo@esg.edu.mz',   'Zacarias Álvaro Vilanculo'),
    ('+258840023008','anabeatriz.mussane@esg.edu.mz',   'Ana Beatriz Mussane'),
    ('+258840023009','bruno.cumbe@esg.edu.mz',          'Bruno Celestino Cumbe'),
    -- ── Turma 24 — 11ª Classe A (Letras) ────────────────────────────────
    ('+258840024001','celeste.guirrugo@esg.edu.mz',     'Celeste Dionísio Guirrugo'),
    ('+258840024002','david.amade@esg.edu.mz',          'David Justino Amade'),
    ('+258840024003','estela.tembe@esg.edu.mz',         'Estela Rodrigues Tembe'),
    ('+258840024004','fausto.chabala@esg.edu.mz',       'Fausto Lúcio Chabala'),
    ('+258840024005','gloria.mondlane@esg.edu.mz',      'Glória Maria Mondlane'),
    ('+258840024006','helio.sitoe@esg.edu.mz',          'Hélio Cristóvão Sitoe'),
    ('+258840024007','ines.machava@esg.edu.mz',         'Inês Patrícia Machava'),
    ('+258840024008','joao.fumo@esg.edu.mz',            'João Domingos Fumo'),
    ('+258840024009','lucia.nhaca@esg.edu.mz',          'Lúcia Fernanda Nhaca'),
    -- ── Turma 25 — 11ª Classe B (Ciências Bio) ──────────────────────────
    ('+258840025001','mario.cossa@esg.edu.mz',          'Mário Esperança Cossa'),
    ('+258840025002','natalia.mabjaia@esg.edu.mz',      'Natália Guido Mabjaia'),
    ('+258840025003','osvaldo.mabunda@esg.edu.mz',      'Osvaldo Teófilo Mabunda'),
    ('+258840025004','paula.libombo@esg.edu.mz',        'Paula Cecília Libombo'),
    ('+258840025005','quintino.nhambe@esg.edu.mz',      'Quintino Elias Nhambe'),
    ('+258840025006','rosa.cuna@esg.edu.mz',            'Rosa Albertina Cuna'),
    ('+258840025007','simao.macandja@esg.edu.mz',       'Simão Baltazar Macandja'),
    ('+258840025008','teresa.zita@esg.edu.mz',          'Teresa Cândida Zita'),
    ('+258840025009','ulisses.nhampossa@esg.edu.mz',    'Ulisses Benigno Nhampossa'),
    -- ── Turma 26 — 11ª Classe C (Ciências Exactas) ──────────────────────
    ('+258840026001','vania.chuele@esg.edu.mz',         'Vânia Gertrudes Chuele'),
    ('+258840026002','walter.zunguze@esg.edu.mz',       'Walter Hipólito Zunguze'),
    ('+258840026003','xenia.chirindza@esg.edu.mz',      'Xénia Irene Chirindza'),
    ('+258840026004','yanis.nhanombe@esg.edu.mz',       'Yanis Joaquim Nhanombe'),
    ('+258840026005','zilda.macuacua@esg.edu.mz',       'Zilda Kátia Macuácua'),
    ('+258840026006','alberto.manhique@esg.edu.mz',     'Alberto Lázaro Manhique'),
    ('+258840026007','belmira.nhabite@esg.edu.mz',      'Belmira Maurício Nhabite'),
    ('+258840026008','claudio.vilanculo@esg.edu.mz',    'Cláudio Nicolau Vilanculo'),
    ('+258840026009','deolinda.mussane@esg.edu.mz',     'Deolinda Osvaldo Mussane'),
    -- ── Turma 27 — 12ª Classe A (Letras) ────────────────────────────────
    ('+258840027001','eduardo.cumbe@esg.edu.mz',        'Eduardo Paulo Cumbe'),
    ('+258840027002','filomena.guirrugo@esg.edu.mz',    'Filomena Quirino Guirrugo'),
    ('+258840027003','geraldo.amade@esg.edu.mz',        'Geraldo Rosário Amade'),
    ('+258840027004','hermelinda.tembe@esg.edu.mz',     'Hermelinda Sérgio Tembe'),
    ('+258840027005','ilidio.chabala@esg.edu.mz',       'Ilídio Teotônio Chabala'),
    ('+258840027006','josefina.mondlane@esg.edu.mz',    'Josefina Ubaldo Mondlane'),
    ('+258840027007','leopoldo.sitoe@esg.edu.mz',       'Leopoldo Valentim Sitoe'),
    ('+258840027008','madalena.machava@esg.edu.mz',     'Madalena Waldemar Machava'),
    ('+258840027009','noel.fumo@esg.edu.mz',            'Noel Xavier Fumo'),
    -- ── Turma 28 — 12ª Classe B (Ciências Bio) ──────────────────────────
    ('+258840028001','olavo.nhaca@esg.edu.mz',          'Olavo Yolanda Nhaca'),
    ('+258840028002','perpetua.cossa@esg.edu.mz',       'Perpétua Zacarias Cossa'),
    ('+258840028003','quiteria.mabjaia@esg.edu.mz',     'Quitéria Adriano Mabjaia'),
    ('+258840028004','rodolfo.mabunda@esg.edu.mz',      'Rodolfo Bernardino Mabunda'),
    ('+258840028005','salome.libombo@esg.edu.mz',       'Salomé Cipriano Libombo'),
    ('+258840028006','tobias.nhambe@esg.edu.mz',        'Tobias Dário Nhambe'),
    ('+258840028007','umbelina.cuna@esg.edu.mz',        'Umbelina Euclides Cuna'),
    ('+258840028008','vitorino.macandja@esg.edu.mz',    'Vitorino Florêncio Macandja'),
    ('+258840028009','wandac.zita@esg.edu.mz',          'Wanda Graciano Zita'),
    -- ── Turma 29 — 12ª Classe C (Ciências Exactas) ──────────────────────
    ('+258840029001','ximena.nhampossa@esg.edu.mz',     'Ximena Hortêncio Nhampossa'),
    ('+258840029002','yolandai.chuele@esg.edu.mz',      'Yolanda Ilídio Chuele'),
    ('+258840029003','zaqueu.zunguze@esg.edu.mz',       'Zaqueu Januário Zunguze'),
    ('+258840029004','americo.chirindza@esg.edu.mz',    'Américo Lopes Chirindza'),
    ('+258840029005','benedita.nhanombe@esg.edu.mz',    'Benedita Mariana Nhanombe'),
    ('+258840029006','celestino.macuacua@esg.edu.mz',   'Celestino Nuno Macuácua'),
    ('+258840029007','domingas.manhique@esg.edu.mz',    'Domingas Onésimo Manhique'),
    ('+258840029008','ernani.nhabite@esg.edu.mz',       'Ernâni Policarpo Nhabite'),
    ('+258840029009','francisca.vilanculo@esg.edu.mz',  'Francisca Quirino Vilanculo')
) AS v(username, email, full_name)
CROSS JOIN std_role r
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- SECÇÃO 2 — PERFIS ESTUDANTE — Escola Secundária SAE
-- WHERE NOT EXISTS evita duplicados sem precisar de constraint UNIQUE explícita
-- =============================================================================

-- ── Turma 21 — 8ª Classe ────────────────────────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 21, '8ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840021001' THEN 13 WHEN '+258840021002' THEN 14 WHEN '+258840021003' THEN 13
        WHEN '+258840021004' THEN 14 WHEN '+258840021005' THEN 13 WHEN '+258840021006' THEN 14
        WHEN '+258840021007' THEN 13 WHEN '+258840021008' THEN 14 WHEN '+258840021009' THEN 13
    END
FROM sae_user u
WHERE u.username IN (
    '+258840021001','+258840021002','+258840021003','+258840021004','+258840021005',
    '+258840021006','+258840021007','+258840021008','+258840021009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 22 — 9ª Classe ────────────────────────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 22, '9ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840022001' THEN 14 WHEN '+258840022002' THEN 15 WHEN '+258840022003' THEN 14
        WHEN '+258840022004' THEN 15 WHEN '+258840022005' THEN 14 WHEN '+258840022006' THEN 15
        WHEN '+258840022007' THEN 14 WHEN '+258840022008' THEN 15 WHEN '+258840022009' THEN 14
    END
FROM sae_user u
WHERE u.username IN (
    '+258840022001','+258840022002','+258840022003','+258840022004','+258840022005',
    '+258840022006','+258840022007','+258840022008','+258840022009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 23 — 10ª Classe ───────────────────────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 23, '10ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840023001' THEN 15 WHEN '+258840023002' THEN 16 WHEN '+258840023003' THEN 15
        WHEN '+258840023004' THEN 16 WHEN '+258840023005' THEN 15 WHEN '+258840023006' THEN 16
        WHEN '+258840023007' THEN 15 WHEN '+258840023008' THEN 16 WHEN '+258840023009' THEN 15
    END
FROM sae_user u
WHERE u.username IN (
    '+258840023001','+258840023002','+258840023003','+258840023004','+258840023005',
    '+258840023006','+258840023007','+258840023008','+258840023009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 24 — 11ª Classe A (Letras) ────────────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 24, '11ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840024001' THEN 16 WHEN '+258840024002' THEN 17 WHEN '+258840024003' THEN 16
        WHEN '+258840024004' THEN 17 WHEN '+258840024005' THEN 16 WHEN '+258840024006' THEN 17
        WHEN '+258840024007' THEN 16 WHEN '+258840024008' THEN 17 WHEN '+258840024009' THEN 16
    END
FROM sae_user u
WHERE u.username IN (
    '+258840024001','+258840024002','+258840024003','+258840024004','+258840024005',
    '+258840024006','+258840024007','+258840024008','+258840024009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 25 — 11ª Classe B (Ciências Bio) ──────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 25, '11ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840025001' THEN 16 WHEN '+258840025002' THEN 17 WHEN '+258840025003' THEN 16
        WHEN '+258840025004' THEN 17 WHEN '+258840025005' THEN 16 WHEN '+258840025006' THEN 17
        WHEN '+258840025007' THEN 16 WHEN '+258840025008' THEN 17 WHEN '+258840025009' THEN 16
    END
FROM sae_user u
WHERE u.username IN (
    '+258840025001','+258840025002','+258840025003','+258840025004','+258840025005',
    '+258840025006','+258840025007','+258840025008','+258840025009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 26 — 11ª Classe C (Ciências Exactas) ──────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 26, '11ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840026001' THEN 16 WHEN '+258840026002' THEN 17 WHEN '+258840026003' THEN 16
        WHEN '+258840026004' THEN 17 WHEN '+258840026005' THEN 16 WHEN '+258840026006' THEN 17
        WHEN '+258840026007' THEN 16 WHEN '+258840026008' THEN 17 WHEN '+258840026009' THEN 16
    END
FROM sae_user u
WHERE u.username IN (
    '+258840026001','+258840026002','+258840026003','+258840026004','+258840026005',
    '+258840026006','+258840026007','+258840026008','+258840026009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 27 — 12ª Classe A (Letras) ────────────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 27, '12ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840027001' THEN 17 WHEN '+258840027002' THEN 18 WHEN '+258840027003' THEN 17
        WHEN '+258840027004' THEN 18 WHEN '+258840027005' THEN 17 WHEN '+258840027006' THEN 18
        WHEN '+258840027007' THEN 17 WHEN '+258840027008' THEN 18 WHEN '+258840027009' THEN 17
    END
FROM sae_user u
WHERE u.username IN (
    '+258840027001','+258840027002','+258840027003','+258840027004','+258840027005',
    '+258840027006','+258840027007','+258840027008','+258840027009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 28 — 12ª Classe B (Ciências Bio) ──────────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 28, '12ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840028001' THEN 17 WHEN '+258840028002' THEN 18 WHEN '+258840028003' THEN 17
        WHEN '+258840028004' THEN 18 WHEN '+258840028005' THEN 17 WHEN '+258840028006' THEN 18
        WHEN '+258840028007' THEN 17 WHEN '+258840028008' THEN 18 WHEN '+258840028009' THEN 17
    END
FROM sae_user u
WHERE u.username IN (
    '+258840028001','+258840028002','+258840028003','+258840028004','+258840028005',
    '+258840028006','+258840028007','+258840028008','+258840028009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- ── Turma 29 — 12ª Classe C (Ciências Exactas) ──────────────────────────────
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, 4, 29, '12ª Classe', '2025-02-01',
    CASE u.username
        WHEN '+258840029001' THEN 17 WHEN '+258840029002' THEN 18 WHEN '+258840029003' THEN 17
        WHEN '+258840029004' THEN 18 WHEN '+258840029005' THEN 17 WHEN '+258840029006' THEN 18
        WHEN '+258840029007' THEN 17 WHEN '+258840029008' THEN 18 WHEN '+258840029009' THEN 17
    END
FROM sae_user u
WHERE u.username IN (
    '+258840029001','+258840029002','+258840029003','+258840029004','+258840029005',
    '+258840029006','+258840029007','+258840029008','+258840029009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id);

-- =============================================================================
-- SECÇÃO 3 — UTILIZADORES PROFESSOR — Escola Secundária SAE
-- 1 professor por disciplina do currículo ESG
-- Telefones: +25885001100N  (N = 1-10)
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
    ('+258850011001', 'joao.tembe@esg.edu.mz',        'João António Tembe'),
    ('+258850011002', 'ana.chirindza@esg.edu.mz',     'Ana Paula Chirindza'),
    ('+258850011003', 'pedro.guambe@esg.edu.mz',      'Pedro Augusto Guambe'),
    ('+258850011004', 'rosa.libombo@esg.edu.mz',      'Rosa Elvira Libombo'),
    ('+258850011005', 'maria.mondlane@esg.edu.mz',    'Maria Isabel Mondlane'),
    ('+258850011006', 'fatima.nhanombe@esg.edu.mz',   'Fátima Rosária Nhanombe'),
    ('+258850011007', 'david.ferreira@esg.edu.mz',    'David Carlos Ferreira'),
    ('+258850011008', 'manuel.sitoe@esg.edu.mz',      'Manuel Sérgio Sitoe'),
    ('+258850011009', 'carlos.machava@esg.edu.mz',    'Carlos José Machava'),
    ('+258850011010', 'amelia.macuacua@esg.edu.mz',   'Amélia Graça Macuácua')
) AS v(username, email, full_name)
CROSS JOIN prf_role r
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- SECÇÃO 4 — PERFIS PROFESSOR — Escola Secundária SAE
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
    ('+258850011001', 'Ciências Exactas',  'Matemática',     'PRF-MAT-ESG-001',  'AMBOS'),
    ('+258850011002', 'Línguas',           'Português',      'PRF-PORT-ESG-001', 'AMBOS'),
    ('+258850011003', 'Ciências Exactas',  'Física',         'PRF-FIS-ESG-001',  'MEDIO'),
    ('+258850011004', 'Ciências Exactas',  'Química',        'PRF-QUIM-ESG-001', 'MEDIO'),
    ('+258850011005', 'Ciências Sociais',  'História',       'PRF-HIST-ESG-001', 'AMBOS'),
    ('+258850011006', 'Ciências Naturais', 'Biologia',       'PRF-BIO-ESG-001',  'AMBOS'),
    ('+258850011007', 'Línguas',           'Inglês',         'PRF-INGL-ESG-001', 'AMBOS'),
    ('+258850011008', 'Tecnologias',       'Informática',    'PRF-INF-ESG-001',  'BASICO'),
    ('+258850011009', 'Ciências Sociais',  'Geografia',      'PRF-GEO-ESG-001',  'BASICO'),
    ('+258850011010', 'Humanidades',       'Filosofia',      'PRF-FILOS-ESG-001','MEDIO')
) AS v(username, department, specialization, prof_code, cycle)
JOIN sae_user u ON u.username = v.username
WHERE NOT EXISTS (SELECT 1 FROM professor_profile WHERE user_id = u.id);

-- =============================================================================
-- SECÇÃO 5 — ATRIBUIÇÕES PROFESSOR → TURMA → DISCIPLINA (ESG)
-- Currículo (ac_class_level_subject BLOCO 21):
--   C21 8ªA:  Mat(1) Port(2) Ingl(7) Hist(5) Geo(11) Bio(6)
--   C22 9ªA:  Mat(1) Port(2) Ingl(7) Hist(5) Geo(11) Bio(6)
--   C23 10ªA: Mat(1) Port(2) Ingl(7) Hist(5) Geo(11) Bio(6) Fís(3) Quím(4) Inf(8)
--   C24 11ªA: Mat(1) Port(2) Ingl(7) Hist(5) Filos(12)
--   C25 11ªB: Mat(1) Port(2) Ingl(7) Fís(3) Quím(4) Bio(6) Filos(12)
--   C26 11ªC: Mat(1) Port(2) Ingl(7) Fís(3) Quím(4) Filos(12)
--   C27 12ªA: Mat(1) Port(2) Ingl(7) Hist(5) Filos(12)
--   C28 12ªB: Mat(1) Port(2) Ingl(7) Fís(3) Quím(4) Bio(6) Filos(12)
--   C29 12ªC: Mat(1) Port(2) Ingl(7) Fís(3) Quím(4) Filos(12)
-- =============================================================================

INSERT INTO ac_professor_assignment (
    status, created_by, created_date, last_modified_by, last_modified_date,
    professor_id, classroom_id, subject_id
)
SELECT 1, 0, NOW(), 0, NOW(), u.id, v.classroom_id, v.subject_id
FROM (VALUES
    -- ── Prof. Matemática (+258850011001) — 8ª, 10ª, 12ªA (3 turmas) ─────
    ('+258850011001', 21, 1), ('+258850011001', 23, 1), ('+258850011001', 27, 1),
    -- ── Prof. Português (+258850011002) — 9ª, 11ªB, 12ªB (3 turmas) ──────
    ('+258850011002', 22, 2), ('+258850011002', 25, 2), ('+258850011002', 28, 2),
    -- ── Prof. Física (+258850011003) — 10ª, 11ªC (2 turmas) ────────────────
    ('+258850011003', 23, 3), ('+258850011003', 26, 3),
    -- ── Prof. Química (+258850011004) — 11ªB, 12ªC (2 turmas) ─────────────
    ('+258850011004', 25, 4), ('+258850011004', 29, 4),
    -- ── Prof. História (+258850011005) — 8ª, 11ªA (2 turmas) ───────────────
    ('+258850011005', 21, 5), ('+258850011005', 24, 5),
    -- ── Prof. Biologia (+258850011006) — 9ª, 11ªB (2 turmas) ───────────────
    ('+258850011006', 22, 6), ('+258850011006', 25, 6),
    -- ── Prof. Inglês (+258850011007) — 11ªA, 11ªC, 12ªC (3 turmas) ─────────
    ('+258850011007', 24, 7), ('+258850011007', 26, 7), ('+258850011007', 29, 7),
    -- ── Prof. Informática (+258850011008) — 10ª (única turma com a disciplina)
    ('+258850011008', 23, 8),
    -- ── Prof. Geografia (+258850011009) — 8ª, 9ª (2 turmas) ────────────────
    ('+258850011009', 21, 11), ('+258850011009', 22, 11),
    -- ── Prof. Filosofia (+258850011010) — 11ªA, 12ªA (2 turmas) ────────────
    ('+258850011010', 24, 12), ('+258850011010', 27, 12)
) AS v(username, classroom_id, subject_id)
JOIN sae_user u ON u.username = v.username
WHERE NOT EXISTS (
    SELECT 1 FROM ac_professor_assignment pa
    WHERE pa.classroom_id = v.classroom_id
      AND pa.subject_id   = v.subject_id
);

-- =============================================================================
-- SECÇÃO 6 — UTILIZADORES ESTUDANTE — Universidade Eduardo Mondlane (UEM)
-- Para verificar IDs: SELECT id, name FROM ac_school WHERE name ILIKE '%Eduardo Mondlane%';
--                     SELECT id, name FROM ac_classroom WHERE school_id = <ID>;
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
    -- ── 1º Ano Turma B ───────────────────────────────────────────────────
    ('+258860001001','ana.muteto@uem.ac.mz',        'Ana Luísa Muteto'),
    ('+258860001002','bernardo.guambe@uem.ac.mz',   'Bernardo Filipe Guambe'),
    ('+258860001003','catia.sitoe@uem.ac.mz',       'Cátia Rosário Sitoe'),
    ('+258860001004','domingos.nhaca@uem.ac.mz',    'Domingos Artur Nhaca'),
    ('+258860001005','elsa.fumo@uem.ac.mz',         'Elsa Conceição Fumo'),
    ('+258860001006','frederico.cossa@uem.ac.mz',   'Frederico Manuel Cossa'),
    ('+258860001007','gertrudes.mabjaia@uem.ac.mz', 'Gertrudes Lúcia Mabjaia'),
    ('+258860001008','horacio.mabunda@uem.ac.mz',   'Horácio Ernesto Mabunda'),
    ('+258860001009','irene.machava@uem.ac.mz',     'Irene Beatriz Machava'),
    -- ── 2º Ano Turma A ───────────────────────────────────────────────────
    ('+258860002001','julio.libombo@uem.ac.mz',     'Júlio César Libombo'),
    ('+258860002002','karoline.nhambe@uem.ac.mz',   'Karoline Sofia Nhambe'),
    ('+258860002003','lisete.cuna@uem.ac.mz',       'Lisete Felicidade Cuna'),
    ('+258860002004','marcos.macandja@uem.ac.mz',   'Marcos Eduardo Macandja'),
    ('+258860002005','nadia.zita@uem.ac.mz',        'Nádia Carla Zita'),
    ('+258860002006','orlando.nhampossa@uem.ac.mz', 'Orlando Tomás Nhampossa'),
    ('+258860002007','petra.chuele@uem.ac.mz',      'Petra Almira Chuele'),
    ('+258860002008','queila.zunguze@uem.ac.mz',    'Queila Fernanda Zunguze'),
    ('+258860002009','renato.chirindza@uem.ac.mz',  'Renato Adriano Chirindza')
) AS v(username, email, full_name)
CROSS JOIN std_role r
ON CONFLICT (username) DO NOTHING;

-- Perfis UEM — 1º Ano Turma B
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id,
    (SELECT s.id FROM ac_school s WHERE s.name ILIKE '%Eduardo Mondlane%' LIMIT 1),
    (SELECT c.id FROM ac_classroom c
     JOIN ac_school s ON c.school_id = s.id
     WHERE s.name ILIKE '%Eduardo Mondlane%'
       AND (c.name ILIKE '%1%Ano%B%' OR c.name ILIKE '%1%ano%B%' OR c.name ILIKE '%Turma B%1%')
     LIMIT 1),
    '1º Ano', '2025-02-01',
    CASE u.username
        WHEN '+258860001001' THEN 18 WHEN '+258860001002' THEN 17 WHEN '+258860001003' THEN 18
        WHEN '+258860001004' THEN 19 WHEN '+258860001005' THEN 18 WHEN '+258860001006' THEN 17
        WHEN '+258860001007' THEN 18 WHEN '+258860001008' THEN 19 WHEN '+258860001009' THEN 18
    END
FROM sae_user u
WHERE u.username IN (
    '+258860001001','+258860001002','+258860001003','+258860001004','+258860001005',
    '+258860001006','+258860001007','+258860001008','+258860001009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id)
  AND (SELECT id FROM ac_school WHERE name ILIKE '%Eduardo Mondlane%' LIMIT 1) IS NOT NULL
  AND (SELECT c.id FROM ac_classroom c
       JOIN ac_school s ON c.school_id = s.id
       WHERE s.name ILIKE '%Eduardo Mondlane%'
         AND (c.name ILIKE '%1%Ano%B%' OR c.name ILIKE '%1%ano%B%' OR c.name ILIKE '%Turma B%1%')
       LIMIT 1) IS NOT NULL;

-- Perfis UEM — 2º Ano Turma A
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id,
    (SELECT s.id FROM ac_school s WHERE s.name ILIKE '%Eduardo Mondlane%' LIMIT 1),
    (SELECT c.id FROM ac_classroom c
     JOIN ac_school s ON c.school_id = s.id
     WHERE s.name ILIKE '%Eduardo Mondlane%'
       AND (c.name ILIKE '%2%Ano%A%' OR c.name ILIKE '%2%ano%A%' OR c.name ILIKE '%Turma A%2%')
     LIMIT 1),
    '2º Ano', '2025-02-01',
    CASE u.username
        WHEN '+258860002001' THEN 20 WHEN '+258860002002' THEN 19 WHEN '+258860002003' THEN 21
        WHEN '+258860002004' THEN 20 WHEN '+258860002005' THEN 19 WHEN '+258860002006' THEN 22
        WHEN '+258860002007' THEN 20 WHEN '+258860002008' THEN 19 WHEN '+258860002009' THEN 21
    END
FROM sae_user u
WHERE u.username IN (
    '+258860002001','+258860002002','+258860002003','+258860002004','+258860002005',
    '+258860002006','+258860002007','+258860002008','+258860002009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id)
  AND (SELECT id FROM ac_school WHERE name ILIKE '%Eduardo Mondlane%' LIMIT 1) IS NOT NULL
  AND (SELECT c.id FROM ac_classroom c
       JOIN ac_school s ON c.school_id = s.id
       WHERE s.name ILIKE '%Eduardo Mondlane%'
         AND (c.name ILIKE '%2%Ano%A%' OR c.name ILIKE '%2%ano%A%' OR c.name ILIKE '%Turma A%2%')
       LIMIT 1) IS NOT NULL;

-- =============================================================================
-- SECÇÃO 7 — UTILIZADORES ESTUDANTE — Universidade Pedagógica (UP)
-- Para verificar IDs: SELECT id, name FROM ac_school WHERE name ILIKE '%Pedag%';
--                     SELECT id, name FROM ac_classroom WHERE school_id = <ID>;
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
    -- ── 2º Ano Turma A ───────────────────────────────────────────────────
    ('+258870001001','sonia.nhanombe@up.ac.mz',     'Sónia Esperança Nhanombe'),
    ('+258870001002','tiago.macuacua@up.ac.mz',     'Tiago Luís Macuácua'),
    ('+258870001003','ursula.manhique@up.ac.mz',    'Úrsula Dina Manhique'),
    ('+258870001004','valter.nhabite@up.ac.mz',     'Valter Ernesto Nhabite'),
    ('+258870001005','xenia.vilanculo@up.ac.mz',    'Xénia Teresa Vilanculo'),
    ('+258870001006','yasmin.mussane@up.ac.mz',     'Yasmin Beatriz Mussane'),
    ('+258870001007','zeferino.cumbe@up.ac.mz',     'Zeferino Hilário Cumbe'),
    ('+258870001008','aderito.guirrugo@up.ac.mz',   'Adérito Filipe Guirrugo'),
    ('+258870001009','blandina.amade@up.ac.mz',     'Blandina Sofia Amade')
) AS v(username, email, full_name)
CROSS JOIN std_role r
ON CONFLICT (username) DO NOTHING;

-- Perfis UP — 2º Ano Turma A
INSERT INTO student_profile (
    status, created_by, created_date, last_modified_by, last_modified_date,
    user_id, school_id, classroom_id, grade, enrollment_date, age
)
SELECT 1, 0, NOW(), 0, NOW(), u.id,
    (SELECT s.id FROM ac_school s WHERE s.name ILIKE '%Pedag%' LIMIT 1),
    (SELECT c.id FROM ac_classroom c
     JOIN ac_school s ON c.school_id = s.id
     WHERE s.name ILIKE '%Pedag%'
       AND (c.name ILIKE '%2%Ano%A%' OR c.name ILIKE '%2%ano%A%' OR c.name ILIKE '%Turma A%2%')
     LIMIT 1),
    '2º Ano', '2025-02-01',
    CASE u.username
        WHEN '+258870001001' THEN 22 WHEN '+258870001002' THEN 21 WHEN '+258870001003' THEN 23
        WHEN '+258870001004' THEN 22 WHEN '+258870001005' THEN 21 WHEN '+258870001006' THEN 24
        WHEN '+258870001007' THEN 22 WHEN '+258870001008' THEN 23 WHEN '+258870001009' THEN 21
    END
FROM sae_user u
WHERE u.username IN (
    '+258870001001','+258870001002','+258870001003','+258870001004','+258870001005',
    '+258870001006','+258870001007','+258870001008','+258870001009'
)
  AND NOT EXISTS (SELECT 1 FROM student_profile WHERE user_id = u.id)
  AND (SELECT id FROM ac_school WHERE name ILIKE '%Pedag%' LIMIT 1) IS NOT NULL
  AND (SELECT c.id FROM ac_classroom c
       JOIN ac_school s ON c.school_id = s.id
       WHERE s.name ILIKE '%Pedag%'
         AND (c.name ILIKE '%2%Ano%A%' OR c.name ILIKE '%2%ano%A%' OR c.name ILIKE '%Turma A%2%')
       LIMIT 1) IS NOT NULL;

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
