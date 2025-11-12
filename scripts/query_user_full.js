#!/usr/bin/env node
const mysql = require('mysql2/promise');

async function main(){
  const email = process.argv[2];
  if(!email){
    console.error('Uso: node scripts/query_user_full.js <email>');
    process.exit(2);
  }

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  };

  if(!config.database){
    console.error('Error: DB_NAME no está configurado en variables de entorno.');
    process.exit(2);
  }

  let conn;
  try{
    conn = await mysql.createConnection(config);
    console.log('Conectado a DB', config.database, 'como', config.user);

    const [rows] = await conn.execute(
      'SELECT id, name, email, level, current_xp, xp_to_next_level, streak, failed_attempts, locked_until FROM `profile_data` WHERE email = ? LIMIT 1',
      [email]
    );

    if(!rows || rows.length === 0){
      console.log('No se encontró ningún usuario con ese email.');
      process.exit(0);
    }

    const user = rows[0];
    console.log('Usuario encontrado:');
    console.log(JSON.stringify(user, null, 2));
    await conn.end();
    process.exit(0);
  }catch(err){
    console.error('Error consultando la base de datos:', err && err.message ? err.message : err);
    if(conn) await conn.end();
    process.exit(1);
  }
}

main();
