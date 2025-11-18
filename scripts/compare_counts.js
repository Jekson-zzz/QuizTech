const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });
  try {
    const sqlFull = `
      SELECT
        c.id,
        c.name,
        COALESCE(qs.total_questions, 0) AS total_questions
      FROM categories c
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS total_questions FROM questions GROUP BY category_id
      ) qs ON qs.category_id = c.id
      ORDER BY c.name ASC
    `;
    const [full] = await conn.execute(sqlFull);
    console.log('\nFull category list with total_questions:');
    console.log(JSON.stringify(full, null, 2));

    const [counts] = await conn.execute('SELECT category_id, COUNT(*) as cnt FROM questions GROUP BY category_id');
    console.log('\nRaw counts by category_id:');
    console.log(JSON.stringify(counts, null, 2));

    const [questions] = await conn.execute('SELECT id, text, category_id, created_at FROM questions WHERE category_id = ? ORDER BY id DESC', [3]);
    console.log('\nQuestions with category_id=3:');
    console.log(JSON.stringify(questions, null, 2));

    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    await conn.end();
    process.exit(1);
  }
})();
