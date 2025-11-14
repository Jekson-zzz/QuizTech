-- Migration: agregar client_quiz_id (para upsert desde cliente) y columna finalized a user_quizzes
ALTER TABLE `user_quizzes`
  ADD COLUMN IF NOT EXISTS `client_quiz_id` VARCHAR(191) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `finalized` TINYINT(1) NOT NULL DEFAULT 0;

-- Índice único por usuario+client_quiz_id para permitir upsert desde cliente
CREATE UNIQUE INDEX IF NOT EXISTS `ux_user_client_quiz` ON `user_quizzes` (`user_id`, `client_quiz_id`);

-- Nota: MySQL permite múltiples NULLs en columnas con índice único, por lo que filas antiguas sin client_quiz_id no romperán el índice.
