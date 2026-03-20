
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (1, '01', 'HEADER', 'Veículos', NULL, 1, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (2, '0101', 'MENU_ITEM', 'Cadastrar Veículo', '/admin/veiculos/cadastrar', 1, 1, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (3, '0102', 'MENU_ITEM', 'Consultar Veículos', '/admin/veiculos/consultar', 2, 1, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (4, '0103', 'MENU_ITEM', 'Eventos de Veículo', '/admin/veiculos/eventos', 3, 1, 1);

-- DUA
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (5, '02', 'HEADER', 'Documentos (DUA)', NULL, 2, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (6, '0201', 'MENU_ITEM', 'Emitir DUA', '/admin/smartSAE/emitir', 1, 5, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (7, '0202', 'MENU_ITEM', 'Consultar DUAs', '/admin/smartSAE/consultar', 2, 5, 1);

-- Proprietários
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (8, '03', 'HEADER', 'Proprietários', NULL, 3, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (9, '0301', 'MENU_ITEM', 'Cadastrar Proprietário', '/admin/proprietarios/cadastrar', 1, 8, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (10, '0302', 'MENU_ITEM', 'Consultar Proprietários', '/admin/proprietarios/consultar', 2, 8, 1);

-- Entidades
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (11, '04', 'HEADER', 'Entidades', NULL, 4, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (12, '0401', 'MENU_ITEM', 'Cadastrar Entidade', '/admin/entidades/cadastrar', 1, 11, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (13, '0402', 'MENU_ITEM', 'Consultar Entidades', '/admin/entidades/consultar', 2, 11, 1);

-- Consentimentos
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (14, '05', 'HEADER', 'Consentimentos', NULL, 5, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (15, '0501', 'MENU_ITEM', 'Gerir Consentimentos', '/admin/consentimentos/gestao', 1, 14, 1);

-- Utilizadores
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (16, '06', 'HEADER', 'Utilizadores', NULL, 6, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (17, '0601', 'MENU_ITEM', 'Consultar Utilizadores', '/admin/utilizadores/consultar', 1, 16, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (18, '0602', 'MENU_ITEM', 'Cadastrar Utilizador', '/admin/utilizadores/cadastrar', 2, 16, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (19, '0603', 'MENU_ITEM', 'Trocar Senha', '/admin/utilizadores/trocar-senha', 3, 16, 1);

-- Logs
INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (20, '07', 'HEADER', 'Logs & Auditoria', NULL, 7, NULL, 1);

INSERT INTO smartSAE_hub.app_transaction(ID, CODE, TYPE, LABEL, ROUTER_LINK, POSITION, PARENT_ID, STATUS)
VALUES (21, '0701', 'MENU_ITEM', 'Consultar Logs', '/admin/logs', 1, 20, 1);

-- ============================================
-- ROLE_TRANSACTION (perfis e permissões)
-- ============================================

-- ADMIN: acesso total
-- ADMIN: acesso total
-- ADMIN: acesso total
INSERT INTO smartSAE_hub.role_transaction (ID, ROLE, APP_TRANSACTION_ID, STATUS)
VALUES 
(1, 'ADMIN', 1, 1),
(2, 'ADMIN', 2, 1),
(3, 'ADMIN', 3, 1),
(4, 'ADMIN', 4, 1),
(5, 'ADMIN', 5, 1),
(6, 'ADMIN', 6, 1),
(7, 'ADMIN', 7, 1),
(8, 'ADMIN', 8, 1),
(9, 'ADMIN', 9, 1),
(10, 'ADMIN', 10, 1),
(11, 'ADMIN', 11, 1),
(12, 'ADMIN', 12, 1),
(13, 'ADMIN', 13, 1),
(14, 'ADMIN', 14, 1),
(15, 'ADMIN', 15, 1),
(16, 'ADMIN', 16, 1),
(17, 'ADMIN', 17, 1),
(18, 'ADMIN', 18, 1),
(19, 'ADMIN', 19, 1),
(20, 'ADMIN', 20, 1),
(21, 'ADMIN', 21, 1);

-- OPERADOR_CONSERVATORIA
INSERT INTO smartSAE_hub.role_transaction (ID, ROLE, APP_TRANSACTION_ID, STATUS)
VALUES
(22, 'OPERADOR_CONSERVATORIA', 1, 1),
(23, 'OPERADOR_CONSERVATORIA', 2, 1),
(24, 'OPERADOR_CONSERVATORIA', 3, 1),
(25, 'OPERADOR_CONSERVATORIA', 4, 1);

-- GESTOR_DUA
INSERT INTO smartSAE_hub.role_transaction (ID, ROLE, APP_TRANSACTION_ID, STATUS)
VALUES
(26, 'GESTOR_DUA', 4, 1),
(27, 'GESTOR_DUA', 5, 1),
(28, 'GESTOR_DUA', 1, 1),
(29, 'GESTOR_DUA', 2, 1),
(30, 'GESTOR_DUA', 3, 1),
(31, 'GESTOR_DUA', 8, 1),
(32, 'GESTOR_DUA', 12, 1),
(33, 'GESTOR_DUA', 16, 1);

-- FUNCIONARIO_IMT
INSERT INTO smartSAE_hub.role_transaction (ID, ROLE, APP_TRANSACTION_ID, STATUS)
VALUES
(34, 'FUNCIONARIO_IMT', 3, 1),
(35, 'FUNCIONARIO_IMT', 7, 1),
(36, 'FUNCIONARIO_IMT', 11, 1),
(37, 'FUNCIONARIO_IMT', 12, 1),
(38, 'FUNCIONARIO_IMT', 16, 1),
(39, 'FUNCIONARIO_IMT', 20, 1);

-- USER
INSERT INTO smartSAE_hub.role_transaction (ID, ROLE, APP_TRANSACTION_ID, STATUS)
VALUES
(40, 'USER', 16, 1),
(41, 'USER', 18, 1);

 

-- Inserir tipos de entidade
INSERT INTO tipo_entidade (id, status, created_date, nome) VALUES 
(1, 1, NOW(), 'CONSERVATÓRIA'),
(2, 1, NOW(), 'IMT - INSTITUTO DA MOBILIDADE E DOS TRANSPORTES'),
(3, 1, NOW(), 'POLÍCIA DE TRÂNSITO'),
(4, 1, NOW(), 'POLÍCIA DA REPÚBLICA DE MOÇAMBIQUE'),
(5, 1, NOW(), 'SERVICOS DE MIGRAÇÃO'),
(6, 1, NOW(), 'ADMINISTRAÇÃO LOCAL'),
(7, 1, NOW(), 'SEGURANÇA PRIVADA'),
(8, 1, NOW(), 'SEGUROS'),
(9, 1, NOW(), 'TRANSPORTES PÚBLICOS'),
(10, 1, NOW(), 'OPERADORES LOGÍSTICOS');


-- CONSERVATÓRIAS (Registo de Veículos e Propriedade)
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'Conservatória de Maputo Cidade', '100000001', 'conservatoria.maputo@justica.gov.mz', '+25821320000', 'Av. 25 de Setembro, Maputo', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória da Matola', '100000002', 'conservatoria.matola@justica.gov.mz', '+25821320100', 'Av. da Matola, Matola', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Gaza', '100000003', 'conservatoria.gaza@justica.gov.mz', '+25828120000', 'Cidade de Xai-Xai, Gaza', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Inhambane', '100000004', 'conservatoria.inhambane@justica.gov.mz', '+25829320000', 'Cidade de Inhambane', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Sofala', '100000005', 'conservatoria.beira@justica.gov.mz', '+25823320000', 'Cidade da Beira, Sofala', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Manica', '100000006', 'conservatoria.manica@justica.gov.mz', '+25825120000', 'Cidade de Chimoio, Manica', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Tete', '100000007', 'conservatoria.tete@justica.gov.mz', '+25825220000', 'Cidade de Tete', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Zambézia', '100000008', 'conservatoria.zambezia@justica.gov.mz', '+25824420000', 'Cidade de Quelimane, Zambézia', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Nampula', '100000009', 'conservatoria.nampula@justica.gov.mz', '+25826220000', 'Cidade de Nampula', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Cabo Delgado', '100000010', 'conservatoria.pemba@justica.gov.mz', '+25827220000', 'Cidade de Pemba, Cabo Delgado', 'https://www.justica.gov.mz', 1),
(1, NOW(), 'Conservatória de Niassa', '100000011', 'conservatoria.niassa@justica.gov.mz', '+25827120000', 'Cidade de Lichinga, Niassa', 'https://www.justica.gov.mz', 1);

-- IMT - INSTITUTO DA MOBILIDADE E DOS TRANSPORTES
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'IMT - Direcção Nacional', '200000001', 'imt.dn@imt.gov.mz', '+25821300000', 'Av. Acordos de Lusaka, Maputo', 'https://www.imt.gov.mz', 2),
(1, NOW(), 'IMT - Delegação de Maputo', '200000002', 'imt.maputo@imt.gov.mz', '+25821300100', 'Av. 25 de Setembro, Maputo', 'https://www.imt.gov.mz', 2),
(1, NOW(), 'IMT - Delegação da Beira', '200000003', 'imt.beira@imt.gov.mz', '+25823300100', 'Av. Pungué, Beira', 'https://www.imt.gov.mz', 2),
(1, NOW(), 'IMT - Delegação de Nampula', '200000004', 'imt.nampula@imt.gov.mz', '+25826200100', 'Av. EsmartSAErdo Mondlane, Nampula', 'https://www.imt.gov.mz', 2),
(1, NOW(), 'IMT - Centro de Inspecções Técnicas Maputo', '200000005', 'cit.maputo@imt.gov.mz', '+25821300200', 'Zona Verde, Maputo', 'https://www.imt.gov.mz', 2);

-- POLÍCIA DE TRÂNSITO
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'Comando Geral da Polícia de Trânsito', '300000001', 'transito@prm.gov.mz', '+25821310000', 'Av. Marien Nguabi, Maputo', 'https://www.prm.gov.mz', 3),
(1, NOW(), 'Destacamento de Trânsito de Maputo', '300000002', 'transito.maputo@prm.gov.mz', '+25821310100', 'Av. 25 de Setembro, Maputo', 'https://www.prm.gov.mz', 3),
(1, NOW(), 'Destacamento de Trânsito da Matola', '300000003', 'transito.matola@prm.gov.mz', '+25821410100', 'Av. da Matola, Matola', 'https://www.prm.gov.mz', 3),
(1, NOW(), 'Destacamento de Trânsito da Beira', '300000004', 'transito.beira@prm.gov.mz', '+25823310100', 'Av. Pungué, Beira', 'https://www.prm.gov.mz', 3),
(1, NOW(), 'Destacamento de Trânsito de Nampula', '300000005', 'transito.nampula@prm.gov.mz', '+25826210100', 'Av. EsmartSAErdo Mondlane, Nampula', 'https://www.prm.gov.mz', 3);

-- POLÍCIA DA REPÚBLICA DE MOÇAMBIQUE (PRM)
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'Comando Geral da PRM', '400000001', 'comando.geral@prm.gov.mz', '+25821310001', 'Av. Marien Nguabi, Maputo', 'https://www.prm.gov.mz', 4),
(1, NOW(), 'DPC - Direcção de Protecção Civil', '400000002', 'dpc@prm.gov.mz', '+25821310002', 'Av. Marien Nguabi, Maputo', 'https://www.prm.gov.mz', 4),
(1, NOW(), 'DIC - Direcção de Investigação Criminal', '400000003', 'dic@prm.gov.mz', '+25821310003', 'Av. Marien Nguabi, Maputo', 'https://www.prm.gov.mz', 4),
(1, NOW(), 'UIR - Unidade de Intervenção Rápida', '400000004', 'uir@prm.gov.mz', '+25821310004', 'Av. Marien Nguabi, Maputo', 'https://www.prm.gov.mz', 4);

-- SERVIÇOS DE MIGRAÇÃO
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'Serviço Nacional de Migração', '500000001', 'migracao@migracao.gov.mz', '+25821330000', 'Av. 25 de Setembro, Maputo', 'https://www.migracao.gov.mz', 5),
(1, NOW(), 'Posto Fronteiriço de Ressano Garcia', '500000002', 'ressano.garcia@migracao.gov.mz', '+25821330100', 'Fronteira com África do Sul', 'https://www.migracao.gov.mz', 5),
(1, NOW(), 'Posto Fronteiriço de Namaacha', '500000003', 'namaacha@migracao.gov.mz', '+25821330200', 'Fronteira com Essuatíni', 'https://www.migracao.gov.mz', 5);

-- ADMINISTRAÇÃO LOCAL (Municípios)
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'Câmara Municipal de Maputo', '600000001', 'transito.cmm@maputo.gov.mz', '+25821340000', 'Av. Julius Nyerere, Maputo', 'https://www.cmm.gov.mz', 6),
(1, NOW(), 'Câmara Municipal da Matola', '600000002', 'transito.matola@matola.gov.mz', '+25821440000', 'Av. da Matola, Matola', 'https://www.cmmatola.gov.mz', 6),
(1, NOW(), 'Câmara Municipal da Beira', '600000003', 'transito.beira@beira.gov.mz', '+25823340000', 'Av. Pungué, Beira', 'https://www.cmbeira.gov.mz', 6),
(1, NOW(), 'Câmara Municipal de Nampula', '600000004', 'transito.nampula@nampula.gov.mz', '+25826240000', 'Av. EsmartSAErdo Mondlane, Nampula', 'https://www.cmnampula.gov.mz', 6);

-- SEGURANÇA PRIVADA
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'Empresa Moçambicana de Segurança', '700000001', 'ems@ems.co.mz', '+25821350000', 'Av. Kenneth Kaunda, Maputo', 'https://www.ems.co.mz', 7),
(1, NOW(), 'Protecta Segurança', '700000002', 'info@protecta.co.mz', '+25821350001', 'Av. 25 de Setembro, Maputo', 'https://www.protecta.co.mz', 7),
(1, NOW(), 'Group 4 Securitas', '700000003', 'mozambique@securitas.co.mz', '+25821350002', 'Av. Julius Nyerere, Maputo', 'https://www.securitas.co.mz', 7);

-- SEGURADORAS
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'EMOSE - Empresa Moçambicana de Seguros', '800000001', 'emose@emose.co.mz', '+25821360000', 'Av. 25 de Setembro, Maputo', 'https://www.emose.co.mz', 8),
(1, NOW(), 'Hollard Seguros', '800000002', 'hollard@hollard.co.mz', '+25821360001', 'Av. Kenneth Kaunda, Maputo', 'https://www.hollard.co.mz', 8),
(1, NOW(), 'Global Seguros', '800000003', 'global@globalseguros.co.mz', '+25821360002', 'Av. Julius Nyerere, Maputo', 'https://www.globalseguros.co.mz', 8);

-- TRANSPORTES PÚBLICOS
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'TPM - Transportes Públicos de Maputo', '900000001', 'tpm@tpm.co.mz', '+25821370000', 'Av. 25 de Setembro, Maputo', 'https://www.tpm.co.mz', 9),
(1, NOW(), 'EMTP - Empresa Municipal de Transportes', '900000002', 'emtp@matola.gov.mz', '+25821470000', 'Av. da Matola, Matola', 'https://www.emtp.co.mz', 9);

-- OPERADORES LOGÍSTICOS
INSERT INTO entidade (status, created_date, nome, nuit, email, telefone, morada, portal_url, tipo_entidade_id) VALUES
(1, NOW(), 'CFM - Portos e Caminhos de Ferro', '1000000001', 'cfm@cfm.co.mz', '+25821380000', 'Av. 25 de Setembro, Maputo', 'https://www.cfm.co.mz', 10),
(1, NOW(), 'Grémio dos Transportadores', '1000000002', 'gremio@transportadores.co.mz', '+25821380001', 'Av. Kenneth Kaunda, Maputo', 'https://www.gremiotransportadores.co.mz', 10);

-- only for root
-- ALTER TABLE smartSAE_user MODIFY created_by BIGINT NULL;


-- pode nao funcionar:
-- OPERADOR_CONSERVATORIA - atribuir a uma conservatória
UPDATE smartSAE_user SET entidade_id = 1 WHERE username LIKE 'shifu.taishi%';