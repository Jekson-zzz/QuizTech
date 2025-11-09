import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { scryptSync, timingSafeEqual } from 'crypto';

// Configuración de bloqueo
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5; // Duración del bloqueo en minutos

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
    // El frontend envía el identificador en la propiedad `email` (puede ser email o nombre de usuario)
    const body = await req.json();
    const identifier = body?.email || body?.identifier || '';
    const password = body?.password;
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const conn = await getConnection();
    // Traemos columnas para manejo de intentos y bloqueo
    // Buscamos por email o por nombre de usuario (`name`) para permitir login con cualquiera de los dos
    const [rows] = await conn.execute(
      'SELECT id, password, failed_attempts, locked_until FROM `profile_data` WHERE email = ? OR name = ? LIMIT 1',
      [identifier, identifier]
    );

    const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;

    if (!user) {
      await conn.end();
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      const now = new Date();
      if (lockedUntil > now) {
        await conn.end();
        return NextResponse.json(
          { error: 'Cuenta bloqueada temporalmente', lockedUntil: lockedUntil.toISOString() },
          { status: 423 }
        );
      }
    }
    const parts = (user.password as string).split(':');
    if (parts.length !== 2) return NextResponse.json({ error: 'Formato de contraseña inválido' }, { status: 500 });
    const [salt, key] = parts;
    const derived = scryptSync(password, salt, 64).toString('hex');

    const keyBuf = Buffer.from(key, 'hex');
    const derivedBuf = Buffer.from(derived, 'hex');

    if (keyBuf.length !== derivedBuf.length || !timingSafeEqual(keyBuf, derivedBuf)) {
      // Contraseña inválida: incrementar contador de intentos
      try {
        const currentAttempts = Number(user.failed_attempts || 0) + 1;
        if (currentAttempts >= MAX_ATTEMPTS) {
          // Bloquear cuenta
          await conn.execute(
            'UPDATE `profile_data` SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
            [currentAttempts, LOCK_MINUTES, user.id]
          );
          await conn.end();
          return NextResponse.json(
            { error: 'Cuenta bloqueada por demasiados intentos', attemptsLeft: 0, lockedUntilMinutes: LOCK_MINUTES },
            { status: 423 }
          );
        } else {
          await conn.execute('UPDATE `profile_data` SET failed_attempts = ? WHERE id = ?', [currentAttempts, user.id]);
          await conn.end();
          return NextResponse.json(
            { error: 'Contraseña inválida', attemptsLeft: Math.max(0, MAX_ATTEMPTS - currentAttempts) },
            { status: 401 }
          );
        }
      } catch (e) {
        console.error('Error actualizando intentos:', e);
        await conn.end();
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
      }
    }

    // Autenticación exitosa — resetear contador y locked_until si existía
    try {
      await conn.execute('UPDATE `profile_data` SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);
    } catch (e) {
      console.error('Error reseteando intentos:', e);
    }
    await conn.end();

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
