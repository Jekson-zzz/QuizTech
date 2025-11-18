-- Migration: 2025-11-16
-- Propósito: Poblar la columna `category_id` en `user_quizzes` usando el valor existente
-- en `category` (cuando contiene un id numérico o coincide con `categories.name`).
-- IMPORTANTE: Hacer backup antes de ejecutar.

-- 1) Backup rápido de la tabla (opcional, recomendado)
-- Nota: si la tabla es grande, usa mysqldump en vez de CREATE TABLE AS
CREATE TABLE IF NOT EXISTS user_quizzes_backup AS SELECT * FROM user_quizzes;

-- 2) Actualizar filas donde `category` es un número (ej: '1', '2')
--    y existe una categoría con ese id.
UPDATE user_quizzes uq
JOIN categories c ON CAST(uq.category AS UNSIGNED) = c.id
SET uq.category_id = c.id
WHERE uq.category_id IS NULL
  AND uq.category REGEXP '^[0-9]+$';

-- 3) Intentar actualizar filas donde `category` coincide exactamente
--    con `categories.name` (comparación usando colación segura).
UPDATE user_quizzes uq
JOIN categories c ON uq.category COLLATE utf8mb4_unicode_ci = c.name COLLATE utf8mb4_unicode_ci
SET uq.category_id = c.id
WHERE uq.category_id IS NULL
  AND uq.category IS NOT NULL;

-- 4) (Opcional) Si tu tabla `categories` tiene columna `slug` y quieres
--    intentar hacer match usando slug, descomenta y ejecuta lo siguiente:
-- UPDATE user_quizzes uq
-- JOIN categories c ON uq.category COLLATE utf8mb4_unicode_ci = c.slug COLLATE utf8mb4_unicode_ci
-- SET uq.category_id = c.id
-- WHERE uq.category_id IS NULL
--   AND uq.category IS NOT NULL;

-- 5) Verificaciones: comprobar cuántas filas se actualizaron y ver ejemplos.
SELECT COUNT(*) AS total_with_category_id FROM user_quizzes WHERE category_id IS NOT NULL;
SELECT COUNT(*) AS remaining_without_category_id FROM user_quizzes WHERE category_id IS NULL;
-- Ver ejemplos (muestra algunas filas afectadas):
SELECT id, user_id, category, category_id, score, created_at FROM user_quizzes ORDER BY created_at DESC LIMIT 50;

-- 6) Re-evaluación de logros (si quieres hacerlo desde SQL, puedes llamar
--    a tu endpoint admin o ejecutar el script JS localmente):
-- node .\scripts\recheck_achievements_for_profile.js <profileId>

-- ROLLBACK / RESTAURACIÓN (si algo sale mal):
-- Si ejecutaste el CREATE TABLE user_quizzes_backup puedes restaurar desde
-- la copia (esto borra la tabla actual y la reemplaza; úsalo con precaución):
-- DROP TABLE IF EXISTS user_quizzes;
-- RENAME TABLE user_quizzes_backup TO user_quizzes;

-- Alternativa menos destructiva: dejar la tabla y sólo revertir `category_id`
-- en el subconjunto afectado (no recomendable sin verificación):
-- UPDATE user_quizzes SET category_id = NULL WHERE id IN (
--   SELECT id FROM user_quizzes_backup
-- );

-- FIN de la migración 2025-11-16
