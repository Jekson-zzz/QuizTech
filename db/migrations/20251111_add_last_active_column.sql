-- Migration: 2025-11-11
-- Añade columna last_active para registrar la última actividad del usuario

ALTER TABLE `profile_data`
  ADD COLUMN IF NOT EXISTS `last_active` DATETIME NULL DEFAULT NULL;

-- NOTA: Si tu versión de MySQL no soporta ADD COLUMN IF NOT EXISTS, ejecuta manualmente
-- SHOW COLUMNS FROM `profile_data` LIKE 'last_active';
