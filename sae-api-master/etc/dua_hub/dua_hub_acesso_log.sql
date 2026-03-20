-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: smartSAE_hub
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acesso_log`
--

DROP TABLE IF EXISTS `acesso_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acesso_log` (
  `id` bigint NOT NULL,
  `status` int DEFAULT NULL,
  `created_by` bigint NOT NULL,
  `created_date` datetime(6) NOT NULL,
  `last_modified_by` bigint DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  `acao` varchar(255) NOT NULL,
  `detalhes` varchar(500) DEFAULT NULL,
  `instante` datetime(6) NOT NULL,
  `objeto` varchar(255) NOT NULL,
  `objeto_id` bigint DEFAULT NULL,
  `origem_ip` varchar(45) DEFAULT NULL,
  `sucesso` bit(1) NOT NULL,
  `entidade_id` bigint DEFAULT NULL,
  `utilizador_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1ddy95cjqjr2eqb0aj9h00rw2` (`entidade_id`),
  KEY `FK2tsjdsg1aclrssc87qwgu1h4p` (`utilizador_id`),
  CONSTRAINT `FK1ddy95cjqjr2eqb0aj9h00rw2` FOREIGN KEY (`entidade_id`) REFERENCES `entidade` (`id`),
  CONSTRAINT `FK2tsjdsg1aclrssc87qwgu1h4p` FOREIGN KEY (`utilizador_id`) REFERENCES `sae_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acesso_log`
--

LOCK TABLES `acesso_log` WRITE;
/*!40000 ALTER TABLE `acesso_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `acesso_log` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-19  0:50:17
