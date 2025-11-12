#!/usr/bin/env node
/**
 * Diagnóstico de lógica de racha (streak).
 * Uso: node scripts/check_streak_logic.js <email_or_id> [--byId]
 * Muestra el valor almacenado en `last_active` y cómo lo interpreta el servidor
 * (parseo como local, parseo forzado a UTC) y qué decisión tomaría la lógica
 * (incrementar, mantener, resetear).
 */

const mysql = require('mysql2/promise');

function toUtcDateKey(d){
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function parseAsUtcFromString(s){
  // Convierte 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SSZ'
  if(!s) return null;
  // Si la cadena es solo 'YYYY-MM-DD', añadimos hora 00:00:00Z
  let z;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    z = s + 'T00:00:00Z';
  } else {
    z = s.replace(' ', 'T') + 'Z';
  }
  const d = new Date(z);
  return isNaN(d.getTime()) ? null : d;
}

async function main(){
  const args = process.argv.slice(2);
  if(args.length === 0){
    console.error('Uso: node scripts/check_streak_logic.js <email_or_id> [--byId]');
    process.exit(2);
  }
  const byId = args.includes('--byId');
  const identifier = args[0];

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
    let where = byId ? 'id = ?' : 'email = ?';
    const [rows] = await conn.execute(`SELECT id, email, streak, last_active FROM \`profile_data\` WHERE ${where} LIMIT 1`, [identifier]);
    if(!Array.isArray(rows) || rows.length === 0){
      console.error('Usuario no encontrado');
      await conn.end();
      process.exit(1);
    }
    const u = rows[0];
    console.log('Row from DB:', u);

    const raw = u.last_active; // may be null or Date object depending on driver
    console.log('\nRaw last_active (JS):', raw);

    if(!raw){
      console.log('No hay last_active guardado. La lógica establecería newStreak = 1.');
      await conn.end();
      process.exit(0);
    }

    // If driver returned a Date object, serialize to string 'YYYY-MM-DD HH:MM:SS'
    let rawString;
    if(raw instanceof Date) rawString = raw.toISOString(); else rawString = String(raw);
    console.log('Raw string representation:', rawString);

    // Parse in different ways
    const parsedLocal = new Date(rawString);
    const parsedForcedUtc = parseAsUtcFromString(String(raw));

    console.log('\nParsed as JS Date (new Date(rawString)) ->', parsedLocal, ' (ms=', parsedLocal.getTime(), ')');
    console.log('Parsed forcing UTC from string ->', parsedForcedUtc, ' (ms=', parsedForcedUtc ? parsedForcedUtc.getTime() : null, ')');

    // Also, if raw is Date already, use it
    const parsedDirect = raw instanceof Date ? raw : null;
    if(parsedDirect) console.log('Parsed direct from driver ->', parsedDirect);

    const now = new Date();
    const todayKey = toUtcDateKey(now);
    const yesterdayKey = toUtcDateKey(new Date(now.getTime() - 24*60*60*1000));

    console.log('\nToday (UTC date key):', new Date(todayKey).toISOString().slice(0,10));
    console.log('Yesterday (UTC date key):', new Date(yesterdayKey).toISOString().slice(0,10));

    function reportFor(d, label){
      if(!d) { console.log(label + ': null'); return; }
      const k = toUtcDateKey(d);
      console.log(`${label}: ${d.toISOString()} -> dateKey=${k} -> date=${new Date(k).toISOString().slice(0,10)}`);
      if(k === todayKey) console.log('  -> same day as today (no change to streak)');
      else if(k === yesterdayKey) console.log('  -> matches yesterday (increment streak)');
      else console.log('  -> older than yesterday (reset streak to 1)');
    }

    reportFor(parsedLocal, 'parsedLocal');
    reportFor(parsedForcedUtc, 'parsedForcedUtc');
    reportFor(parsedDirect, 'parsedDirect');

    // Show what newStreak would be using parsedForcedUtc and current streak
    const prevStreak = Number(u.streak || 0);
    const forcedKey = parsedForcedUtc ? toUtcDateKey(parsedForcedUtc) : null;
    let decision = 'reset to 1';
    if(forcedKey === todayKey) decision = 'no change';
    else if(forcedKey === yesterdayKey) decision = `increment to ${prevStreak + 1}`;
    console.log(`\nUsing parsedForcedUtc, prevStreak=${prevStreak} => decision: ${decision}`);

    await conn.end();
    process.exit(0);
  } catch(err){
    console.error('Error:', err && err.message ? err.message : err);
    if(conn) await conn.end();
    process.exit(1);
  }
}

main();
