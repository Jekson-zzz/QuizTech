const fs = require('fs');
const mysql = require('mysql2/promise');
async function main(){
  const env = fs.readFileSync('.env.local','utf8')
    .split(/\r?\n/)
    .map(l=>l.trim())
    .filter(Boolean)
    .reduce((acc,line)=>{ const [k,v]=line.split('='); acc[k]=v||''; return acc },{});

  const host = env.DB_HOST || '127.0.0.1';
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const dbName = env.DB_NAME || 'quizz-tech-backend';

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS \`profile_data\` (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY ux_profile_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `;

  try{
    const conn = await mysql.createConnection({ host, user, password, database: dbName });
    await conn.query(createTableSQL);
    console.log('Table profile_data created or already exists');
    await conn.end();
    process.exit(0);
  }catch(err){
    console.error('Failed to create table:', err.message || err);
    process.exit(1);
  }
}
main();
