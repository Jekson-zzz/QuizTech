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
    const body = await req.json();
    const username = body?.username;
    const email = body?.email;
    const newPassword = body?.newPassword;

    if (!username || !email || !newPassword) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id FROM `profile_data` WHERE name = ? AND email = ? LIMIT 1',
      [username, email]
    );
    const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;

    if (!user) {
      await conn.end();
      // Mensaje genérico para no revelar si el usuario/email existe
      return NextResponse.json({ error: 'Usuario o correo no es correcto' }, { status: 404 });
    }

    // generar nuevo salt y hash
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(newPassword, salt, 64).toString('hex');
    const stored = `${salt}:${derived}`;

    await conn.execute('UPDATE `profile_data` SET password = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?', [stored, user.id]);
    await conn.end();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('update-password error:', err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
