-- schema.sql
-- Cria banco e tabela de administradores (sem inserir senha em texto claro)
CREATE DATABASE IF NOT EXISTS paiva_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paiva_db;

CREATE TABLE IF NOT EXISTS adm (
  login VARCHAR(50) NOT NULL PRIMARY KEY,
  senha VARCHAR(255) NOT NULL
);
