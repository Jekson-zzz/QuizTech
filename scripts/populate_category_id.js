const mysql = require('mysql2/promise')
;(async () => {
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  }
  const conn = await mysql.createConnection(cfg)
  try {
    console.log('1) Populate category_id from numeric category strings')
    const [res1] = await conn.execute(
      `UPDATE user_quizzes uq
       JOIN categories c ON CAST(uq.category AS UNSIGNED) = c.id
       SET uq.category_id = c.id
       WHERE uq.category_id IS NULL AND uq.category REGEXP '^[0-9]+$'`
    )
    console.log('Updated rows (numeric->id):', (res1 && res1.affectedRows) || 0)

    console.log('2) Populate category_id by matching exact category name')
    const [res2] = await conn.execute(
      `UPDATE user_quizzes uq
       JOIN categories c ON uq.category = c.name
       SET uq.category_id = c.id
       WHERE uq.category_id IS NULL AND uq.category IS NOT NULL`
    )
    console.log('Updated rows (name match):', (res2 && res2.affectedRows) || 0)

    console.log('Done.')
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e)
  } finally {
    await conn.end()
  }
})()
