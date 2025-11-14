-- Migration: Crear tabla de niveles y registro de eventos de XP
CREATE TABLE IF NOT EXISTS `levels` (
  `level` INT NOT NULL PRIMARY KEY,
  `xp_to_reach` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `profile_xp_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `profile_id` BIGINT UNSIGNED NOT NULL,
  `user_quiz_id` BIGINT UNSIGNED DEFAULT NULL,
  `amount` INT NOT NULL,
  `source` VARCHAR(191) DEFAULT 'quiz',
  `meta` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`profile_id`),
  INDEX (`user_quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Opcional: insertar niveles de ejemplo
INSERT INTO `levels` (`level`, `xp_to_reach`) VALUES
(1, 1000),
(2, 1500),
(3, 2000),
(4, 3000)
ON DUPLICATE KEY UPDATE xp_to_reach = VALUES(xp_to_reach);

-- Nota: no se elimina ni modifica `profile_data`; se usará `levels` para calcular umbrales.
