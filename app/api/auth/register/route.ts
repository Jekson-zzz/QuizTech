import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { randomBytes, scryptSync } from 'crypto';

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_db',
    port: Number(process.env.DB_PORT || 3306),
  });
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    // generar salt y hash con scrypt (Node builtin)
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    const stored = `${salt}:${derived}`; // guardar salt:hash

    const conn = await getConnection();
    await conn.execute(
      'INSERT INTO `profile_data` (`name`,`email`,`password`) VALUES (?,?,?)',
      [name, email, stored]
    );
    await conn.end();

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 });
    }
    // En desarrollo devolvemos el mensaje de error para debugeo
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}