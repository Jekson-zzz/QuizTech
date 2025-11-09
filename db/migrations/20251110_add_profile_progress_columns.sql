-- Migration: 2025-11-10
-- Añade columnas de progreso al perfil: nivel, XP y racha
-- NOTA: usa `ADD COLUMN IF NOT EXISTS` para compatibilidad; el script de migración manejará versiones antiguas de MySQL.

ALTER TABLE `profile_data`
  ADD COLUMN IF NOT EXISTS `level` INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `current_xp` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `xp_to_next_level` INT NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS `streak` INT NOT NULL DEFAULT 0;

-- Ajusta valores por defecto según prefieras. Haz backup antes de aplicar en producción.
