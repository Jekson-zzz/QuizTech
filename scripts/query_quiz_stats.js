#!/usr/bin/env node
const mysql = require('mysql2/promise');

async function main(){
  const email = process.argv[2];
  if(!email){
    console.error('Uso: node scripts/query_quiz_stats.js <email>');
    process.exit(2);
  }

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || undefined,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  };

  let conn;
  try{
    conn = await mysql.createConnection(config);
    console.log('Conectado a DB', config.database, 'como', config.user);

    // Get user by email
  const [users] = await conn.execute('SELECT id, name, email, quizzes_completed, average_score FROM `profile_data` WHERE email = ? LIMIT 1', [email]);
    if(!users || users.length === 0){
      console.log('No se encontró usuario');
      process.exit(0);
    }
    const user = users[0];
    console.log('Profile aggregated fields:');
    console.log(JSON.stringify(user, null, 2));

    // List recent user_quizzes
    const [qrows] = await conn.execute('SELECT id, category, score, duration_seconds, created_at FROM `user_quizzes` WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [user.id]);
    console.log('Recent quizzes:');
    console.log(JSON.stringify(qrows, null, 2));

    await conn.end();
  }catch(err){
    console.error('Error:', err && err.message ? err.message : err);
    if(conn) await conn.end();
    process.exit(1);
  }
}

main();
