const fs = require('fs');
const mysql = require('mysql2/promise');
const { randomBytes } = require('crypto');

async function main(){
  const env = fs.readFileSync('.env.local','utf8')
    .split(/\r?\n/)
    .map(l=>l.trim())
    .filter(Boolean)
    .reduce((acc,line)=>{ const [k,v]=line.split('='); acc[k]=v||''; return acc },{});

  const host = env.DB_HOST || '127.0.0.1';
  const rootUser = env.DB_USER || 'root';
  const rootPass = env.DB_PASSWORD || '';
  const dbName = env.DB_NAME || 'quizz-tech-backend';

  // generate a secure password
  const newUser = 'quizz_user';
  const newPass = randomBytes(12).toString('base64').replace(/\/+|\=+/g,'').slice(0,20);

  console.log('Creating DB user', newUser, 'for database', dbName);
  try{
    const conn = await mysql.createConnection({ host, user: rootUser, password: rootPass });
    // Create user and grant privileges
    await conn.query(`CREATE USER IF NOT EXISTS \`${newUser}\`@'127.0.0.1' IDENTIFIED BY ?`, [newPass]);
    await conn.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${dbName}\`.* TO \`${newUser}\`@'127.0.0.1'`);
    await conn.query('FLUSH PRIVILEGES');
    await conn.end();

    // update .env.local
    const envPath = '.env.local';
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/DB_USER=.*/,'DB_USER='+newUser);
    content = content.replace(/DB_PASSWORD=.*/,'DB_PASSWORD='+newPass);
    fs.writeFileSync(envPath, content, 'utf8');

    console.log('Created user and updated .env.local with new credentials. Password:', newPass);
    console.log('Keep this password safe; .env.local should not be committed.');
    process.exit(0);
  }catch(err){
    console.error('Error creating user:', err.message || err);
    process.exit(1);
  }
}

main();
