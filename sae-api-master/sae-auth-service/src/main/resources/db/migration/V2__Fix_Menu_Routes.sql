-- ─────────────────────────────────────────────────────────────────────────────
-- V2 – Correcção de rotas do menu dinâmico e adição de itens em falta
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Corrigir rotas ADMIN para bater com os paths reais do frontend
UPDATE APP_TRANSACTION SET ROUTER_LINK = '/admin/academic/schools'              WHERE CODE = '0201';
UPDATE APP_TRANSACTION SET ROUTER_LINK = '/admin/academic/classrooms'           WHERE CODE = '0202';
UPDATE APP_TRANSACTION SET ROUTER_LINK = '/admin/academic/subjects'             WHERE CODE = '0203';
UPDATE APP_TRANSACTION SET ROUTER_LINK = '/admin/users/list'                    WHERE CODE = '0204';

-- 2. Adicionar "Biblioteca Digital" ao menu do PROFESSOR
INSERT INTO APP_TRANSACTION (CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (
    '0304', 'MENU_ITEM', 'Biblioteca Digital', '/professor/library', 4,
    (SELECT ID FROM APP_TRANSACTION WHERE CODE = '03'), 1
) ON CONFLICT (CODE) DO UPDATE SET ROUTER_LINK = '/professor/library';

-- 3. Adicionar "Fórum" ao menu do PROFESSOR
INSERT INTO APP_TRANSACTION (CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (
    '0305', 'MENU_ITEM', 'Fórum', '/professor/forum', 5,
    (SELECT ID FROM APP_TRANSACTION WHERE CODE = '03'), 1
) ON CONFLICT (CODE) DO UPDATE SET ROUTER_LINK = '/professor/forum';

-- 4. Adicionar "Biblioteca Digital" ao menu do ADMIN
INSERT INTO APP_TRANSACTION (CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (
    '0206', 'MENU_ITEM', 'Biblioteca Digital', '/admin/library', 6,
    (SELECT ID FROM APP_TRANSACTION WHERE CODE = '02'), 1
) ON CONFLICT (CODE) DO NOTHING;

-- 5. Mapear novos itens nas ROLE_TRANSACTION (PROFESSOR)
INSERT INTO ROLE_TRANSACTION (ROLE, APP_TRANSACTION_ID, STATUS)
SELECT 'PROFESSOR', ID, 1 FROM APP_TRANSACTION WHERE CODE = '0304'
AND NOT EXISTS (
    SELECT 1 FROM ROLE_TRANSACTION rt
    WHERE rt.ROLE = 'PROFESSOR'
    AND rt.APP_TRANSACTION_ID = (SELECT ID FROM APP_TRANSACTION WHERE CODE = '0304')
);

INSERT INTO ROLE_TRANSACTION (ROLE, APP_TRANSACTION_ID, STATUS)
SELECT 'PROFESSOR', ID, 1 FROM APP_TRANSACTION WHERE CODE = '0305'
AND NOT EXISTS (
    SELECT 1 FROM ROLE_TRANSACTION rt
    WHERE rt.ROLE = 'PROFESSOR'
    AND rt.APP_TRANSACTION_ID = (SELECT ID FROM APP_TRANSACTION WHERE CODE = '0305')
);

-- 6. Mapear novo item de biblioteca do ADMIN
INSERT INTO ROLE_TRANSACTION (ROLE, APP_TRANSACTION_ID, STATUS)
SELECT 'ADMIN', ID, 1 FROM APP_TRANSACTION WHERE CODE = '0206'
AND NOT EXISTS (
    SELECT 1 FROM ROLE_TRANSACTION rt
    WHERE rt.ROLE = 'ADMIN'
    AND rt.APP_TRANSACTION_ID = (SELECT ID FROM APP_TRANSACTION WHERE CODE = '0206')
);

-- Actualizar sequências
SELECT setval('app_transaction_id_seq', (SELECT MAX(id) FROM app_transaction));
SELECT setval('role_transaction_id_seq', (SELECT MAX(id) FROM role_transaction));
