#!/usr/bin/env node
/**
 * Script pequeño para ejecutar una migración SQL contra la BD usando mysql2/promise.
 * Usa variables de entorno: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
 * Ejecución: node scripts/run_migration.js db/migrations/20251109_add_lockout_columns.sql
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const [, , migrationPath] = process.argv;
  if (!migrationPath) {
    console.error('Uso: node scripts/run_migration.js <ruta_sql>');
    process.exit(2);
  }

  const fullPath = path.resolve(migrationPath);
  if (!fs.existsSync(fullPath)) {
    console.error('Archivo no encontrado:', fullPath);
    process.exit(2);
  }

  const sql = fs.readFileSync(fullPath, 'utf8');

  const mysql = require('mysql2/promise');

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  };

  if (!config.database) {
    console.error('Error: DB_NAME no está configurado. Configura la variable de entorno DB_NAME.');
    process.exit(2);
  }

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Conectado a la base de datos', config.host + ':' + config.port, 'database=' + config.database);

    // Intentamos ejecutar statements tal cual (permitimos múltiples statements)
    try {
      const [results] = await conn.query(sql);
      console.log('Migración ejecutada. Resultado:', results);
      await conn.end();
      process.exit(0);
    } catch (execErr) {
      // Si el error está relacionado con 'IF NOT EXISTS' (sintaxis no soportada), intentamos una estrategia segura
      const msg = execErr && execErr.message ? execErr.message : String(execErr);
      console.warn('Ejecución directa falló:', msg);

      if (!/IF NOT EXISTS/i.test(sql)) {
        throw execErr; // no es el caso que esperamos, relanzar
      }

      console.log('Intentando aplicar migración de forma compatible (comprobando columnas en INFORMATION_SCHEMA)...');

      // Extraer el nombre de la tabla objetivo (ej. ALTER TABLE `profile_data`)
      const tableMatch = sql.match(/ALTER\s+TABLE\s+`?(\w+)`?/i);
      if (!tableMatch) {
        throw new Error('No se pudo extraer el nombre de la tabla desde la migración.');
      }
      const tableName = tableMatch[1];

      // Buscar todas las sentencias ADD COLUMN IF NOT EXISTS `col` <definition>
      const addColumnRegex = /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+`?(\w+)`?\s+([^,;]+)/ig;
      let match;
      const columnsToAdd = [];
      while ((match = addColumnRegex.exec(sql)) !== null) {
        const colName = match[1];
        const definition = match[2].trim();
        columnsToAdd.push({ colName, definition });
      }

      if (columnsToAdd.length === 0) {
        throw new Error('No se encontraron columnas para añadir con IF NOT EXISTS en la migración.');
      }

      for (const col of columnsToAdd) {
        // Comprobar existencia en INFORMATION_SCHEMA
        const [rowsCheck] = await conn.execute(
          'SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
          [config.database, tableName, col.colName]
        );
  const cnt = Array.isArray(rowsCheck) && rowsCheck.length ? rowsCheck[0].cnt : 0;
        if (Number(cnt) > 0) {
          console.log(`La columna ${col.colName} ya existe en ${tableName}, se omite.`);
          continue;
        }

        // Ejecutar ALTER TABLE para añadir la columna con la definición capturada
        const alterSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.colName}\` ${col.definition}`;
        console.log('Ejecutando:', alterSql);
        try {
          await conn.execute(alterSql);
          console.log(`Columna ${col.colName} añadida correctamente.`);
        } catch (alterErr) {
          console.error(`Error al añadir la columna ${col.colName}:`, alterErr && alterErr.message ? alterErr.message : alterErr);
          throw alterErr;
        }
      }

      await conn.end();
      console.log('Migración aplicada con estrategia compatible.');
      process.exit(0);
    }

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Error al ejecutar la migración:', err && err.message ? err.message : err);
    if (conn) await conn.end();
    process.exit(1);
  }
}

main();
