-- Migration: 2025-11-10 (quizzes and aggregated stats)
-- Añade columnas agregadas en `profile_data` y crea la tabla `user_quizzes` para almacenar intentos/completados.

-- Añadir columnas a profile_data (si existe IF NOT EXISTS será manejado por el script)
ALTER TABLE `profile_data`
  ADD COLUMN IF NOT EXISTS `quizzes_completed` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `average_score` DOUBLE NOT NULL DEFAULT 0;

-- Tabla para almacenar cada intento/completado de quiz
CREATE TABLE IF NOT EXISTS `user_quizzes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `category` VARCHAR(100) NULL,
  `score` DOUBLE NOT NULL,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profile_data`(`id`) ON DELETE CASCADE
);

-- Nota: Si tu versión de MySQL no soporta ADD COLUMN IF NOT EXISTS, usa el script de migración que verifica INFORMATION_SCHEMA.
