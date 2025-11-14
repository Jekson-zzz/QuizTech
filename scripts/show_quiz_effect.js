const mysql = require('mysql2/promise');

(async () => {
  const profileId = process.argv[2] ? Number(process.argv[2]) : 8;
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  };

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Connected to DB', config.database);

    // Último user_quiz insertado para este perfil
    const [uq] = await conn.execute('SELECT * FROM `user_quizzes` WHERE user_id = ? ORDER BY id DESC LIMIT 5', [profileId]);
    console.log('\nLast user_quizzes (up to 5):');
    console.log(JSON.stringify(uq, null, 2));

    const [xpEvents] = await conn.execute('SELECT * FROM `profile_xp_events` WHERE profile_id = ? ORDER BY created_at DESC LIMIT 10', [profileId]);
    console.log('\nRecent profile_xp_events (up to 10):');
    console.log(JSON.stringify(xpEvents, null, 2));

    const [pd] = await conn.execute('SELECT id, level, current_xp, xp_to_next_level, quizzes_completed, average_score FROM `profile_data` WHERE id = ? LIMIT 1', [profileId]);
    console.log('\nProfile data:');
    console.log(JSON.stringify(pd && pd[0] ? pd[0] : null, null, 2));

    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('DB check error:', e && e.message ? e.message : e);
    if (conn) await conn.end();
    process.exit(1);
  }
})();
