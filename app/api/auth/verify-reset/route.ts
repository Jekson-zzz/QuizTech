import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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
    const body = await req.json();
    const username = body?.username;
    const email = body?.email;

    if (!username || !email) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id FROM `profile_data` WHERE name = ? AND email = ? LIMIT 1',
      [username, email]
    );
    await conn.end();

    const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    if (!user) {
      // Mensaje genérico para no revelar si el usuario/email existe
      return NextResponse.json({ error: 'Usuario o correo no es correcto' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('verify-reset error:', err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
