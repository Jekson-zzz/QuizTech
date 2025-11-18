const mysql = require('mysql2/promise')
;(async () => {
  const profileId = process.argv[2] ? Number(process.argv[2]) : 8
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  }
  const conn = await mysql.createConnection(cfg)
  try {
    const [rows] = await conn.execute(
      'SELECT id, user_id, category_id, category, score, finalized, created_at FROM user_quizzes WHERE user_id = ? ORDER BY created_at ASC',
      [profileId]
    )
    const list = Array.isArray(rows) ? rows : []
    console.log('User quizzes for profile', profileId, 'count =', list.length)
    for (const r of list) {
      console.log(JSON.stringify(r))
    }
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e)
  } finally {
    await conn.end()
  }
})()
