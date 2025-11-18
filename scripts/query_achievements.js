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
    const [rows] = await conn.execute('SELECT id, `key`, title, description, criteria, xp_reward, is_hidden FROM achievements ORDER BY id')
    console.log('achievements:')
    for (const r of rows) {
      console.log(JSON.stringify(r))
    }
  } catch (e) {
    console.error('Error querying achievements:', e)
  } finally { await conn.end() }
})()
