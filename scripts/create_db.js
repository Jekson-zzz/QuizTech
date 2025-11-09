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

  console.log('Connecting to', host, 'as', user, 'password empty?', password==='');
  try{
    const conn = await mysql.createConnection({ host, user, password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log('Database created or already exists:', dbName);
    await conn.end();
    process.exit(0);
  }catch(err){
    console.error('Failed to create DB:', err.message || err);
    process.exit(1);
  }
}
main();
