-- Migration: 2025-11-02
-- Propósito: Aumentar longitud de password y añadir índice único en email.
-- Recomendación: revisar/ejecutar en un entorno de pruebas primero.

-- 1) Backup rápido (crea copia si no existe)
CREATE TABLE IF NOT EXISTS `profile_data_backup` AS SELECT * FROM `profile_data`;

-- 2) Aumentar longitud de password para almacenar hashes
ALTER TABLE `profile_data`
  MODIFY COLUMN `password` VARCHAR(255) NOT NULL;

-- 3) Añadir índice único en email (si ya existe fallará; comprobar antes)
-- Si tu versión de MySQL no soporta ADD INDEX IF NOT EXISTS, ejecuta manualmente:
-- SHOW INDEX FROM `profile_data` WHERE Key_name = 'ux_profile_email';
-- Si no existe, ejecutar la siguiente línea:
ALTER TABLE `profile_data`
  ADD UNIQUE INDEX `ux_profile_email` (`email`);

-- 4) Opcional: convertir motor a InnoDB (descomentar si lo quieres)
-- ALTER TABLE `profile_data` ENGINE = InnoDB;

-- 5) Opcional: añadir id autoincremental si lo deseas
-- ALTER TABLE `profile_data` ADD COLUMN `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;
