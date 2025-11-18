const mysql = require('mysql2/promise')
;(async () => {
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  }
  const userId = 8
  const conn = await mysql.createConnection(cfg)
  try {
    const [rows] = await conn.execute('SELECT id, created_at FROM `user_quizzes` WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId])
    if (!Array.isArray(rows) || !rows.length) {
      console.log('No user_quiz found for user', userId)
      await conn.end()
      return
    }
    const uq = rows[0]
    const uqId = uq.id
    console.log('Latest user_quiz id for user', userId, '=>', uqId, 'created_at=', uq.created_at)

    const [ansRows] = await conn.execute('SELECT id, question_id, answer_id, is_correct, created_at FROM `user_answers` WHERE user_quiz_id = ? ORDER BY id ASC', [uqId])
    console.log('user_answers rows count:', Array.isArray(ansRows) ? ansRows.length : 0)
    if (Array.isArray(ansRows) && ansRows.length) {
      console.log('Rows:')
      for (const r of ansRows) {
        console.log(JSON.stringify(r))
      }
    }
  } catch (e) {
    console.error('Error checking user_answers:', e)
  } finally {
    await conn.end()
  }
})()
