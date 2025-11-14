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

    const categoryId = process.argv[2] ? Number(process.argv[2]) : 1;

    const [qrows] = await conn.execute(
      `SELECT q.id AS question_id, q.text AS question_text, q.difficulty AS question_difficulty,
       a.id AS answer_id, a.text AS answer_text, a.is_correct
       FROM questions q
       JOIN scenarios s ON q.scenario_id = s.id
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE s.category_id = ?
       ORDER BY q.id, a.id ASC`,
      [categoryId]
    );

    const rowsArray = Array.isArray(qrows) ? qrows : [];
    const map = new Map();
    for (const r of rowsArray) {
      const qid = Number(r.question_id);
      if (!map.has(qid)) {
        map.set(qid, {
          id: qid,
          question: r.question_text,
          type: 'single',
          difficulty: r.question_difficulty || 'medio',
          order: 0,
          points: 1,
          options: [],
        });
      }
      if (r.answer_id) {
        map.get(qid).options.push({ id: r.answer_id, text: r.answer_text, is_correct: Number(r.is_correct || 0) });
      }
    }

    const questions = Array.from(map.values());
    console.log(JSON.stringify({ category: { id: categoryId, name: 'TEST' }, questions }, null, 2));

    await conn.end();
  } catch (e) {
    console.error('error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
