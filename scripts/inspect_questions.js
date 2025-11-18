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
    const [byId] = await conn.execute('SELECT id, question, category_id, category FROM questions WHERE category_id = ? ORDER BY id DESC', [3]);
    console.log('\nquestions with category_id=3:');
    console.log(JSON.stringify(byId, null, 2));

    const [byStr] = await conn.execute('SELECT id, question, category_id, category FROM questions WHERE category = ? ORDER BY id DESC', ['3']);
    console.log('\nquestions with category string="3":');
    console.log(JSON.stringify(byStr, null, 2));

    const [byName] = await conn.execute('SELECT id, question, category_id, category FROM questions WHERE category = ? ORDER BY id DESC', ['Redes']);
    console.log('\nquestions with category name "Redes":');
    console.log(JSON.stringify(byName, null, 2));

    const [counts] = await conn.execute('SELECT category_id, category, COUNT(*) as cnt FROM questions GROUP BY category_id, category ORDER BY category_id');
    console.log('\ncounts grouped by category_id and category:');
    console.log(JSON.stringify(counts, null, 2));

    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    await conn.end();
    process.exit(1);
  }
})();
