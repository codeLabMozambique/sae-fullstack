-- =====================================================================
-- SAE - Seed: Disciplinas por Nível e Atribuições de Professor por Turma
-- Ficheiro: seed_disciplinaspornivel.sql
-- Base de dados: sae_db (PostgreSQL)
--
-- Como executar:
--   psql -U postgres -d sae_db -f seed_disciplinaspornivel.sql
--   ou copiar e colar no pgAdmin Query Tool
--
-- PASSO 1: Execute o bloco de DIAGNÓSTICO para obter os usernames reais.
-- PASSO 2: Substitua 'USERNAME_DO_ESTUDANTE' e 'USERNAME_DO_PROFESSOR'
--          pelos valores obtidos no diagnóstico, depois execute o bloco DO.
--
-- STATUS: 1 = ACTIVE, 0 = INACTIVE  (EntityState ordinal)
-- =====================================================================


-- =====================================================================
-- PASSO 1 — DIAGNÓSTICO (executar primeiro)
-- =====================================================================

-- Todos os utilizadores com a sua role
SELECT
    u.id,
    u.username,
    u.full_name,
    rt.role
FROM sae_user u
LEFT JOIN role_transaction rt ON rt.id = u.rolet_id
ORDER BY rt.role, u.username;

-- Perfil do estudante: turma, nível e escola
SELECT
    u.username,
    u.full_name,
    sp.classroom_id,
    c.name           AS turma,
    cl.name          AS nivel_classe,
    c.shift          AS turno,
    c.academic_year  AS ano_lectivo,
    sp.school_id
FROM student_profile sp
JOIN sae_user        u   ON u.id   = sp.user_id
LEFT JOIN ac_classroom    c   ON c.id   = sp.classroom_id
LEFT JOIN ac_class_level  cl  ON cl.id  = c.class_level_id
WHERE sp.status = 1;

-- Professores disponíveis no sistema
SELECT
    u.id   AS professor_user_id,
    u.username,
    u.full_name,
    pp.specialization,
    pp.department
FROM professor_profile pp
JOIN sae_user u ON u.id = pp.user_id
WHERE pp.status = 1;

-- Disciplinas já existentes
SELECT id, name, code, status
FROM ac_subject
ORDER BY name;

-- Atribuições já existentes (professor → turma → disciplina)
SELECT
    pa.id,
    u.username        AS professor,
    u.full_name       AS nome_professor,
    c.name            AS turma,
    cl.name           AS nivel,
    s.name            AS disciplina,
    pa.status
FROM ac_professor_assignment pa
JOIN sae_user        u   ON u.id  = pa.professor_id
JOIN ac_classroom    c   ON c.id  = pa.classroom_id
JOIN ac_subject      s   ON s.id  = pa.subject_id
LEFT JOIN ac_class_level cl ON cl.id = c.class_level_id
ORDER BY c.name, s.name;


-- =====================================================================
-- PASSO 2 — SEED (substituir usernames abaixo antes de executar)
-- =====================================================================

DO $$
DECLARE
    -- ── CONFIGURE AQUI ──────────────────────────────────────────────
    v_student_username   TEXT := 'USERNAME_DO_ESTUDANTE';   -- ex: '999999999'
    v_professor_username TEXT := 'USERNAME_DO_PROFESSOR';   -- ex: 'prof.joao'

    -- Dados da turma a criar SE o estudante ainda não tiver uma
    v_nivel_classe       TEXT := '10ª Classe';   -- 8ª, 9ª, 10ª, 11ª ou 12ª Classe
    v_nome_turma         TEXT := 'Turma A';      -- ex: 'Turma A', '10A', etc.
    v_turno              TEXT := 'Manhã';        -- ex: 'Manhã', 'Tarde', 'Noite'
    v_ano_lectivo        TEXT := '2025';
    v_nome_escola        TEXT := 'Escola Secundária SAE'; -- usada se não houver escola
    -- ────────────────────────────────────────────────────────────────

    v_student_user_id BIGINT;
    v_classroom_id    BIGINT;
    v_class_level     TEXT;
    v_professor_id    BIGINT;
    v_class_level_id  BIGINT;
    v_school_id       BIGINT;
    v_has_profile     BOOLEAN;

    -- IDs das disciplinas
    v_port BIGINT;  -- Português
    v_mat  BIGINT;  -- Matemática
    v_ing  BIGINT;  -- Inglês
    v_fis  BIGINT;  -- Física
    v_qui  BIGINT;  -- Química
    v_bio  BIGINT;  -- Biologia
    v_his  BIGINT;  -- História
    v_geo  BIGINT;  -- Geografia
    v_fil  BIGINT;  -- Filosofia
    v_inf  BIGINT;  -- Informática

    v_subject_id BIGINT;
    subj_ids     BIGINT[];

BEGIN

    -- ── 0. Verificar que o utilizador existe ────────────────────────
    SELECT id INTO v_student_user_id
    FROM   sae_user
    WHERE  username = v_student_username
    LIMIT  1;

    IF v_student_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilizador "%" não existe na tabela sae_user.', v_student_username;
    END IF;
    RAISE NOTICE '>> Utilizador encontrado: ID=%', v_student_user_id;

    -- ── 1. Verificar se já tem STUDENT_PROFILE ──────────────────────
    SELECT EXISTS (
        SELECT 1 FROM student_profile WHERE user_id = v_student_user_id
    ) INTO v_has_profile;

    -- ── 1a. Garantir que existe pelo menos uma escola ───────────────
    SELECT id INTO v_school_id FROM ac_school WHERE status = 1 LIMIT 1;
    IF v_school_id IS NULL THEN
        INSERT INTO ac_school (name, city, status)
        VALUES (v_nome_escola, 'Maputo', 1)
        RETURNING id INTO v_school_id;
        RAISE NOTICE '  Escola criada: ID=%', v_school_id;
    END IF;

    -- ── 1b. Garantir que existe o nível de classe configurado ───────
    SELECT id INTO v_class_level_id
    FROM   ac_class_level
    WHERE  name = v_nivel_classe
    LIMIT  1;

    IF v_class_level_id IS NULL THEN
        INSERT INTO ac_class_level (name, status)
        VALUES (v_nivel_classe, 1)
        RETURNING id INTO v_class_level_id;
        RAISE NOTICE '  Nível criado: % ID=%', v_nivel_classe, v_class_level_id;
    END IF;

    -- ── 1c. Garantir que existe uma turma para esse nível/escola ────
    SELECT id INTO v_classroom_id
    FROM   student_profile sp
    WHERE  sp.user_id = v_student_user_id
      AND  sp.classroom_id IS NOT NULL
    LIMIT  1;

    -- se o perfil já tem turma, usar essa; caso contrário criar/reutilizar
    IF v_classroom_id IS NULL THEN
        -- tentar reutilizar turma existente com mesmo nível, escola e ano
        SELECT c.id INTO v_classroom_id
        FROM   ac_classroom   c
        WHERE  c.class_level_id = v_class_level_id
          AND  c.school_id      = v_school_id
          AND  c.academic_year  = v_ano_lectivo
          AND  c.status         = 1
        LIMIT  1;

        IF v_classroom_id IS NULL THEN
            INSERT INTO ac_classroom (name, school_id, class_level_id, shift, academic_year, status)
            VALUES (v_nome_turma, v_school_id, v_class_level_id, v_turno, v_ano_lectivo, 1)
            RETURNING id INTO v_classroom_id;
            RAISE NOTICE '  Turma criada: "%" ID=%', v_nome_turma, v_classroom_id;
        ELSE
            RAISE NOTICE '  Turma reutilizada: ID=%', v_classroom_id;
        END IF;
    END IF;

    -- ── 1d. Criar ou actualizar o STUDENT_PROFILE ───────────────────
    IF NOT v_has_profile THEN
        INSERT INTO student_profile (user_id, school_id, classroom_id, status)
        VALUES (v_student_user_id, v_school_id, v_classroom_id, 1);
        RAISE NOTICE '  Perfil de estudante criado para user_id=%', v_student_user_id;
    ELSE
        UPDATE student_profile
        SET    classroom_id = v_classroom_id,
               school_id    = v_school_id
        WHERE  user_id = v_student_user_id;
        RAISE NOTICE '  Perfil de estudante actualizado: classroom_id=%', v_classroom_id;
    END IF;

    SELECT cl.name INTO v_class_level
    FROM   ac_classroom   c
    JOIN   ac_class_level cl ON cl.id = c.class_level_id
    WHERE  c.id = v_classroom_id;

    RAISE NOTICE '>> Turma pronta: ID=%, Nível=%', v_classroom_id, COALESCE(v_class_level, 'desconhecido');

    -- ── 2. Obter ID do professor ────────────────────────────────────
    SELECT u.id INTO v_professor_id
    FROM   sae_user u
    WHERE  u.username = v_professor_username
      AND  u.status   = 1
    LIMIT  1;

    IF v_professor_id IS NULL THEN
        RAISE EXCEPTION
            'Professor "%" não encontrado ou inactivo. Verifique o DIAGNÓSTICO.',
            v_professor_username;
    END IF;

    RAISE NOTICE '>> Professor encontrado: ID=%', v_professor_id;

    -- ── 3. Inserir disciplinas (sem duplicar) ───────────────────────
    -- Os nomes têm de corresponder exactamente ao mapeamento em
    -- subjectToDisciplina() no frontend (normalização remove acentos
    -- e caracteres especiais; a comparação é case-insensitive).

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Português') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Português', 'Língua Portuguesa e Comunicação', 'PORT', 1);
        RAISE NOTICE '  Disciplina criada: Português';
    END IF;
    SELECT id INTO v_port FROM ac_subject WHERE name = 'Português';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Matemática') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Matemática', 'Matemática', 'MAT', 1);
        RAISE NOTICE '  Disciplina criada: Matemática';
    END IF;
    SELECT id INTO v_mat FROM ac_subject WHERE name = 'Matemática';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Inglês') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Inglês', 'Língua Inglesa', 'ING', 1);
        RAISE NOTICE '  Disciplina criada: Inglês';
    END IF;
    SELECT id INTO v_ing FROM ac_subject WHERE name = 'Inglês';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Física') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Física', 'Física', 'FIS', 1);
        RAISE NOTICE '  Disciplina criada: Física';
    END IF;
    SELECT id INTO v_fis FROM ac_subject WHERE name = 'Física';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Química') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Química', 'Química', 'QUI', 1);
        RAISE NOTICE '  Disciplina criada: Química';
    END IF;
    SELECT id INTO v_qui FROM ac_subject WHERE name = 'Química';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Biologia') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Biologia', 'Biologia', 'BIO', 1);
        RAISE NOTICE '  Disciplina criada: Biologia';
    END IF;
    SELECT id INTO v_bio FROM ac_subject WHERE name = 'Biologia';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'História') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('História', 'História', 'HIS', 1);
        RAISE NOTICE '  Disciplina criada: História';
    END IF;
    SELECT id INTO v_his FROM ac_subject WHERE name = 'História';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Geografia') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Geografia', 'Geografia', 'GEO', 1);
        RAISE NOTICE '  Disciplina criada: Geografia';
    END IF;
    SELECT id INTO v_geo FROM ac_subject WHERE name = 'Geografia';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Filosofia') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Filosofia', 'Filosofia', 'FIL', 1);
        RAISE NOTICE '  Disciplina criada: Filosofia';
    END IF;
    SELECT id INTO v_fil FROM ac_subject WHERE name = 'Filosofia';

    IF NOT EXISTS (SELECT 1 FROM ac_subject WHERE name = 'Informática') THEN
        INSERT INTO ac_subject (name, description, code, status)
        VALUES ('Informática', 'Tecnologias de Informação e Comunicação', 'INF', 1);
        RAISE NOTICE '  Disciplina criada: Informática';
    END IF;
    SELECT id INTO v_inf FROM ac_subject WHERE name = 'Informática';

    RAISE NOTICE '>> IDs: PORT=% MAT=% ING=% FIS=% QUI=% BIO=% HIS=% GEO=% FIL=% INF=%',
        v_port, v_mat, v_ing, v_fis, v_qui, v_bio, v_his, v_geo, v_fil, v_inf;

    -- ── 4. Seleccionar disciplinas adequadas ao nível da turma ──────
    --
    --  8ª / 9ª Classe  → Português, Matemática, Inglês,
    --                     História, Geografia, Biologia
    --
    --  10ª Classe      → Português, Matemática, Inglês,
    --                     História, Geografia,
    --                     Física, Química, Biologia, Informática
    --
    --  11ª / 12ª       → Português, Matemática, Inglês,
    --                     Física, Química, Biologia,
    --                     Filosofia, Informática
    --
    --  Nível desconhecido → todas as disciplinas

    IF v_class_level ILIKE '%8%' OR v_class_level ILIKE '%9%' THEN
        subj_ids := ARRAY[v_port, v_mat, v_ing, v_his, v_geo, v_bio];
        RAISE NOTICE '>> Nível 8ª/9ª detectado — 6 disciplinas';

    ELSIF v_class_level ILIKE '%10%' THEN
        subj_ids := ARRAY[v_port, v_mat, v_ing, v_his, v_geo, v_fis, v_qui, v_bio, v_inf];
        RAISE NOTICE '>> Nível 10ª detectado — 9 disciplinas';

    ELSIF v_class_level ILIKE '%11%' OR v_class_level ILIKE '%12%' THEN
        subj_ids := ARRAY[v_port, v_mat, v_ing, v_fis, v_qui, v_bio, v_fil, v_inf];
        RAISE NOTICE '>> Nível 11ª/12ª detectado — 8 disciplinas';

    ELSE
        subj_ids := ARRAY[v_port, v_mat, v_ing, v_fis, v_qui, v_bio, v_his, v_geo, v_fil, v_inf];
        RAISE NOTICE '>> Nível desconhecido — todas as disciplinas (10)';
    END IF;

    -- ── 5. Criar atribuições professor → turma → disciplina ─────────
    FOREACH v_subject_id IN ARRAY subj_ids LOOP
        IF NOT EXISTS (
            SELECT 1 FROM ac_professor_assignment
            WHERE  professor_id = v_professor_id
              AND  classroom_id = v_classroom_id
              AND  subject_id   = v_subject_id
        ) THEN
            INSERT INTO ac_professor_assignment (professor_id, classroom_id, subject_id, status)
            VALUES (v_professor_id, v_classroom_id, v_subject_id, 1);
            RAISE NOTICE '  Atribuição criada → professor=%, turma=%, disciplina=%',
                v_professor_id, v_classroom_id, v_subject_id;
        ELSE
            RAISE NOTICE '  Já existe → professor=%, turma=%, disciplina=%',
                v_professor_id, v_classroom_id, v_subject_id;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '=== CONCLUÍDO. Verifique com o bloco de DIAGNÓSTICO acima. ===';

END $$;
