-- Migration: 2025-11-11
-- Convierte la columna `last_active` de DATETIME a DATE (solo fecha).
-- Pasos seguros:
-- 1) Añadir columna temporal last_active_date (DATE)
-- 2) Copiar valores con DATE(last_active)
-- 3) Borrar columna antigua
-- 4) Renombrar columna temporal a last_active

SET @tableName = 'profile_data';

-- 1) Añadir columna temporal
ALTER TABLE `profile_data`
  ADD COLUMN  `last_active_date` DATE NULL DEFAULT NULL;

-- 2) Copiar valores (si last_active existía)
UPDATE `profile_data` SET `last_active_date` = DATE(`last_active`) WHERE `last_active` IS NOT NULL;

-- 3) Borrar la columna antigua (si existe)
-- Nota: si tu versión de MySQL no permite DROP COLUMN IF EXISTS, revisa manualmente.
ALTER TABLE `profile_data` DROP COLUMN IF EXISTS `last_active`;

-- 4) Renombrar columna temporal a last_active
ALTER TABLE `profile_data` CHANGE COLUMN `last_active_date` `last_active` DATE NULL DEFAULT NULL;

-- Recomendación: hacer backup antes de aplicar en producción.
