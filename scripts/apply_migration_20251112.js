#!/usr/bin/env node
// Script: apply_migration_20251112.js
// Ejecuta la migración SQL por pasos, ignorando errores comunes de existencia
// Uso: node scripts/apply_migration_20251112.js

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const migrationPath = path.resolve(__dirname, '..', 'db', 'migrations', '20251112_create_quiz_schema.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('Archivo de migración no encontrado:', migrationPath);
    process.exit(2);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    // don't enable multipleStatements globally; we'll run statements one-by-one
  };

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Conectado a la base de datos', config.host + ':' + config.port, 'database=' + config.database);

    // Simple splitter: divide por punto y coma. Nuestro SQL es simple y no contiene ; dentro de strings.
    const rawStatements = sql.split(/;\s*\n/);
    const statements = rawStatements.map(s => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      try {
        console.log('Ejecutando statement:\n', stmt.slice(0, 200).replace(/\n/g, ' '), '...');
        await conn.execute(stmt);
        console.log('OK');
      } catch (e) {
        const code = e && e.code ? e.code : null;
        const errno = e && e.errno ? e.errno : null;
        // Ignorar errores por existencia previa de tablas/columnas/índices
        if (code === 'ER_TABLE_EXISTS_ERROR' || errno === 1050) {
          console.log('Tabla ya existe, omitiendo.');
          continue;
        }
        if (code === 'ER_DUP_FIELDNAME' || errno === 1060) {
          console.log('Columna/índice ya existe, omitiendo.');
          continue;
        }
        if (code === 'ER_DUP_KEYNAME' || errno === 1022) {
          console.log('Índice/constraint ya existe, omitiendo.');
          continue;
        }
        // Si falla por FK (no existe tabla padre), intenta re-colocar al final: simple strategy not implemented here
        console.error('Error ejecutando statement:', e && e.message ? e.message : e);
        throw e;
      }
    }

    console.log('Migración aplicada (por pasos).');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Fallo al aplicar migración:', err && err.message ? err.message : err);
    if (conn) await conn.end();
    process.exit(1);
  }
}

main();
