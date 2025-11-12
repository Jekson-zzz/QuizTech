#!/usr/bin/env node
/**
 * Test flow: set last_active to yesterday and immediately call the login endpoint
 * to verify streak increment (automates the manual steps).
 * Usage: node scripts/test_streak_flow.js <email> <password>
 * Ensure your dev server is running at http://localhost:3000 and DB env vars are set.
 */

const mysql = require('mysql2/promise');

async function httpPostJson(url, body){
  if(typeof fetch !== 'function'){
    // Node <18 fallback: attempt to require node-fetch
    try{
      global.fetch = require('node-fetch');
    }catch(e){
      throw new Error('fetch is not available. Run this script with Node 18+ or install node-fetch.');
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try{ json = JSON.parse(text); }catch(e){ json = text; }
  return { status: res.status, body: json };
}

async function main(){
  const args = process.argv.slice(2);
  if(args.length < 2){
    console.error('Usage: node scripts/test_streak_flow.js <email> <password>');
    process.exit(2);
  }
  const [email, password] = args;

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  };
  if(!config.database) return console.error('Set DB_NAME in env before running.');

  let conn;
  try{
    conn = await mysql.createConnection(config);
    console.log('Connected to DB', config.database);

    const [beforeRows] = await conn.execute('SELECT id, email, streak, last_active FROM `profile_data` WHERE email = ? LIMIT 1', [email]);
    if(!Array.isArray(beforeRows) || beforeRows.length === 0) return console.error('User not found');
    console.log('Before update:', beforeRows[0]);

  // Set last_active to yesterday in UTC-4 (store DATE only)
  await conn.execute('UPDATE `profile_data` SET last_active = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR - INTERVAL 1 DAY) WHERE email = ? LIMIT 1', [email]);
    const [midRows] = await conn.execute('SELECT id, email, streak, last_active FROM `profile_data` WHERE email = ? LIMIT 1', [email]);
    console.log('After setting last_active to yesterday:', midRows[0]);

    // call login endpoint
    console.log('Calling login endpoint...');
    const url = process.env.TEST_SERVER_URL || 'http://localhost:3000/api/auth/login';
    const res = await httpPostJson(url, { email, password });
    console.log('Login response:', res.status, res.body);

    const [afterRows] = await conn.execute('SELECT id, email, streak, last_active FROM `profile_data` WHERE email = ? LIMIT 1', [email]);
    console.log('After login (DB):', afterRows[0]);

    await conn.end();
    process.exit(0);
  }catch(err){
    console.error('Error:', err && err.message ? err.message : err);
    if(conn) await conn.end();
    process.exit(1);
  }
}

main();
