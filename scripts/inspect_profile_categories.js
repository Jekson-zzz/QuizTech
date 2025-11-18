const mysql = require('mysql2/promise')
;(async () => {
  const profileId = process.argv[2] ? Number(process.argv[2]) : 8
  const neededScore = process.argv[3] ? Number(process.argv[3]) : 100
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  }
  const conn = await mysql.createConnection(cfg)
  try {
    console.log('Checking categories with at least one quiz >=', neededScore, 'for profile', profileId)
    const [rows] = await conn.execute(
      `SELECT c.id, c.name FROM categories c WHERE EXISTS (
         SELECT 1 FROM user_quizzes uq WHERE uq.user_id = ? AND uq.score >= ? AND uq.category_id = c.id
      ) ORDER BY c.id`,
      [profileId, neededScore]
    )
    const list = Array.isArray(rows) ? rows : []
    console.log('Matched categories count =', list.length)
    for (const r of list) {
      console.log(JSON.stringify(r))
    }
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e)
  } finally {
    await conn.end()
  }
})()
