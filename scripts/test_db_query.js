const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'quizz_user',
      password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
      database: process.env.DB_NAME || 'quizz-tech-backend',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    });

    console.log('Connected to DB');

    const categoryId = process.argv[2] ? Number(process.argv[2]) : 1;

    const [rows] = await conn.execute(
      `SELECT q.id AS question_id, q.text AS question_text, q.difficulty AS question_difficulty,
       a.id AS answer_id, a.text AS answer_text, a.is_correct
       FROM questions q
       JOIN scenarios s ON q.scenario_id = s.id
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE s.category_id = ?
       ORDER BY q.id, a.id ASC`,
      [categoryId]
    );

    console.log('Sample rows:', rows.slice(0, 10));
    await conn.end();
  } catch (e) {
    console.error('DB query error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
