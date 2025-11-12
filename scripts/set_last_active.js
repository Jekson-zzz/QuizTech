#!/usr/bin/env node
/**
 * Uso: node scripts/set_last_active.js <email_or_id> [--byId]
 * Ejemplo: node scripts/set_last_active.js juan@correo.com
 * Ejemplo por id: node scripts/set_last_active.js 42 --byId
 *
 * Actualiza `profile_data.last_active` a "ayer" (UTC) para simular que el usuario
 * hizo actividad el día anterior y así probar la lógica de racha.
 */

const mysql = require('mysql2/promise');

async function main(){
  const args = process.argv.slice(2);
  if(args.length === 0){
    console.error('Uso: node scripts/set_last_active.js <email_or_id> [--byId]');
    process.exit(2);
  }
  const byId = args.includes('--byId');
  // identifier is the first non-flag argument
  const identifier = args.find(a => !a.startsWith('--'));
  // Optional --date YYYY-MM-DD to set a specific date instead of "yesterday"
  const dateFlagIndex = args.findIndex(a => a === '--date');
  const specificDate = dateFlagIndex !== -1 ? args[dateFlagIndex + 1] : null;

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
    console.log('Conectado a DB', config.database);

    let whereClause, params;
    if(byId){
      whereClause = 'id = ?';
      params = [identifier];
    } else {
      whereClause = 'email = ?';
      params = [identifier];
    }

  // Si se especificó una fecha concreta la usamos (formato YYYY-MM-DD),
  // si no, por defecto ponemos la fecha de ayer en UTC-4.
  let updateSql;
  let paramsSql = params;
  if (specificDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(specificDate)) {
      console.error('Formato de fecha inválido para --date. Usa YYYY-MM-DD');
      process.exit(2);
    }
    updateSql = `UPDATE \`profile_data\` SET last_active = ? WHERE ${whereClause} LIMIT 1`;
    paramsSql = [specificDate, ...params];
  } else {
    updateSql = `UPDATE \`profile_data\` SET last_active = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR - INTERVAL 1 DAY) WHERE ${whereClause} LIMIT 1`;
  }
    const [res] = await conn.execute(updateSql, paramsSql);
    console.log('UPDATE result:', res && res.affectedRows ? res.affectedRows : res);

    const [rows] = await conn.execute(`SELECT id, email, streak, last_active FROM \`profile_data\` WHERE ${whereClause} LIMIT 1`, params);
    if(Array.isArray(rows) && rows.length){
      console.log('Usuario ahora:', rows[0]);
    } else {
      console.log('No se encontró usuario con ese identificador.');
    }

    await conn.end();
    process.exit(0);
  } catch(err){
    console.error('Error:', err && err.message ? err.message : err);
    if(conn) await conn.end();
    process.exit(1);
  }
}

main();
