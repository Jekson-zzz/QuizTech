-- Migration: Create achievements and profile_achievements tables
-- Date: 2025-11-15

CREATE TABLE IF NOT EXISTS `achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(255) DEFAULT NULL,
  `criteria` JSON DEFAULT NULL,
  `xp_reward` INT NOT NULL DEFAULT 0,
  `is_hidden` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `profile_achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `profile_id` INT UNSIGNED NOT NULL,
  `achievement_id` INT UNSIGNED NOT NULL,
  `unlocked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `extra` JSON DEFAULT NULL,
  UNIQUE KEY `ux_profile_achievement` (`profile_id`, `achievement_id`),
  INDEX `ix_profile_id` (`profile_id`),
  INDEX `ix_achievement_id` (`achievement_id`),
  CONSTRAINT `fk_profile_achievements_profile`
    FOREIGN KEY (`profile_id`) REFERENCES `profile_data` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_profile_achievements_achievement`
    FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Example seed rows (uncomment to run as simple seed):
-- INSERT INTO `achievements` (`key`,`title`,`description`,`icon`,`criteria`,`xp_reward`,`is_hidden`)
-- VALUES
-- ('first_quiz','Primer Quiz','Completa tu primer quiz','trophy.svg', JSON_OBJECT('type','complete_quiz','count',1), 50, 0),
-- ('streak_7','Racha 7 días','Responde quizzes 7 días seguidos','streak7.svg', JSON_OBJECT('type','streak','days',7), 200, 0);

-- Example: otorgar logro a perfil (usar dentro de una transacción para evitar duplicados):
-- INSERT INTO profile_achievements (profile_id, achievement_id)
-- SELECT ?, a.id FROM achievements a WHERE a.`key` = 'first_quiz' AND NOT EXISTS (
--   SELECT 1 FROM profile_achievements pa WHERE pa.profile_id = ? AND pa.achievement_id = a.id
-- );
