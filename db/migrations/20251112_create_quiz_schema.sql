-- Migration: 2025-11-12 (create quiz schema: categories, scenarios, questions, answers, user_answers)
-- Propósito: Añadir las tablas necesarias para el módulo de quiz sin romper la estructura existente.
-- Notas:
--  - No creamos la tabla `users`: este proyecto usa `profile_data` como tabla de usuarios.
--  - Esta migración asume que el motor de tablas es InnoDB para soportar claves foráneas.

-- 1) categories
CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) scenarios
CREATE TABLE `scenarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `scenarios`
  ADD INDEX `idx_scenarios_category_id` (`category_id`),
  ADD CONSTRAINT `fk_scenarios_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE;

-- 3) questions
CREATE TABLE `questions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `scenario_id` INT UNSIGNED NULL,
  `text` TEXT NOT NULL,
  `difficulty` ENUM('facil','medio','dificil') NOT NULL DEFAULT 'medio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `questions`
  ADD INDEX `idx_questions_category_id` (`category_id`),
  ADD INDEX `idx_questions_scenario_id` (`scenario_id`),
  ADD CONSTRAINT `fk_questions_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_questions_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON DELETE SET NULL;

-- 4) answers
CREATE TABLE `answers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT UNSIGNED NOT NULL,
  `text` TEXT NOT NULL,
  `is_correct` BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `answers`
  ADD INDEX `idx_answers_question_id` (`question_id`),
  ADD CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE;

-- 5) keep compatibility in user_quizzes: add optional category_id
ALTER TABLE `user_quizzes` ADD COLUMN `category_id` INT UNSIGNED NULL;
CREATE INDEX `idx_user_quizzes_category_id` ON `user_quizzes` (`category_id`);
ALTER TABLE `user_quizzes` ADD CONSTRAINT `fk_user_quizzes_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL;

-- 6) user_answers
CREATE TABLE `user_answers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_quiz_id` INT UNSIGNED NOT NULL,
  `question_id` INT UNSIGNED NOT NULL,
  `answer_id` INT UNSIGNED NOT NULL,
  `is_correct` BOOLEAN NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `user_answers`
  ADD INDEX `idx_user_answers_user_quiz_id` (`user_quiz_id`),
  ADD INDEX `idx_user_answers_question_id` (`question_id`),
  ADD INDEX `idx_user_answers_answer_id` (`answer_id`),
  ADD CONSTRAINT `fk_user_answers_user_quiz` FOREIGN KEY (`user_quiz_id`) REFERENCES `user_quizzes`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_answers_answer` FOREIGN KEY (`answer_id`) REFERENCES `answers`(`id`) ON DELETE CASCADE;

-- Opcional: seed mínimo (descomentar si quieres crear una categoría por defecto)
-- INSERT INTO `categories` (`name`,`description`) SELECT 'General','Categoría general' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `name` = 'General');

-- Fin de migración 2025-11-12
