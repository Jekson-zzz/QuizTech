const mysql = require('mysql2/promise');

async function run() {
  const userId = process.argv[2] || '8';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: Number(process.env.DB_PORT || 3306),
  });

  const sql = `
      SELECT
        c.id,
        c.name,
        COALESCE(qs.total_questions, 0) AS total_questions,
        COALESCE(ua.answered_questions, 0) AS answered_questions,
        COALESCE(ua.correct_answers, 0) AS correct_answers,
        uq_stats.avg_score,
        uq_stats.total_attempts
      FROM categories c
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS total_questions FROM questions GROUP BY category_id
      ) qs ON qs.category_id = c.id
      LEFT JOIN (
        SELECT q.category_id AS cid,
               COUNT(DISTINCT ua.question_id) AS answered_questions,
               COUNT(DISTINCT CASE WHEN ua.is_correct = 1 THEN ua.question_id END) AS correct_answers
        FROM user_answers ua
        JOIN user_quizzes uq ON ua.user_quiz_id = uq.id
        JOIN questions q ON ua.question_id = q.id
        WHERE uq.user_id = ?
        GROUP BY q.category_id
      ) ua ON ua.cid = c.id
      LEFT JOIN (
        SELECT uq.category_id AS cid,
               ROUND(AVG(uq.score),0) AS avg_score,
               COUNT(*) AS total_attempts
        FROM user_quizzes uq
        WHERE uq.user_id = ?
        GROUP BY uq.category_id
      ) uq_stats ON uq_stats.cid = c.id
      ORDER BY c.name ASC
    `;

  const [rows] = await conn.execute(sql, [userId, userId]);
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}

run().catch(err => {
  console.error('Error running SQL', err.message || err);
  process.exit(1);
});
