-- Migration: 2025-11-09
-- Añade columnas para manejo de intentos fallidos y bloqueo temporal en profile_data
-- Ejecutar con precaución en un entorno de pruebas antes de producción.

ALTER TABLE `profile_data`
  ADD COLUMN IF NOT EXISTS `failed_attempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `locked_until` DATETIME NULL DEFAULT NULL;

-- Nota: Si tu versión de MySQL/MariaDB no soporta ADD COLUMN IF NOT EXISTS, ejecuta las consultas separadas
-- y usa comprobaciones previas como SHOW COLUMNS FROM `profile_data` LIKE 'failed_attempts';
