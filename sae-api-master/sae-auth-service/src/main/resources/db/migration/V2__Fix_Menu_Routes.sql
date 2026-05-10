
INSERT INTO sae_user (status, created_date, username, email, password, full_name, enabled, "rolet_id")
VALUES
  -- Administrador
  (1, NOW(), 'admin',     'admin@smartsae.mz',     '$2b$10$xwmFOAOvq/ENI/mmYeSw9.uOA5D4XpFpU1CuK4lNPB1VuNf7aZRuu', 'Administrador SAE',  true, 10),
  -- Professor
  (1, NOW(), '841000001', 'professor@smartsae.mz', '$2b$10$J.SNsdP5pa3N38lo8pVxuuG589/k71keyitBk.OBC1BBqLubjRl4.', 'Professor Exemplo',  true, 20),
  -- Estudante
  (1, NOW(), '841000002', 'aluno@smartsae.mz',     '$2b$10$5VRcaE9cV.BOuzjeQlS8WuHBCumoOoWh8lgCvgrm8PjujOa7coVEe', 'Aluno Exemplo',      true, 30)
ON CONFLICT (username) DO NOTHING;
