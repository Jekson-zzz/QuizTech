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
      // Mensaje genérico para no revelar si el usuario/email existe
      return NextResponse.json({ error: 'Usuario o correo incorrectos' }, { status: 401 });
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
          // Mensaje genérico para no revelar si el usuario/email existe o la contraseña es incorrecta
          return NextResponse.json(
            { error: 'Usuario o correo no es correcto', attemptsLeft: Math.max(0, MAX_ATTEMPTS - currentAttempts) },
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
    // Intentar actualizar también la racha (streak) y last_active al iniciar sesión.
    // Mismo criterio que en quiz/complete: comparación por fecha UTC.
    try {
      const [rows2] = await conn.execute('SELECT streak, last_active FROM `profile_data` WHERE id = ? LIMIT 1', [user.id]);
      const r = Array.isArray(rows2) && rows2.length ? (rows2 as any)[0] : null;
      if (r) {
        const prevStreak = Number(r.streak || 0);
        // Normalize last_active to YYYY-MM-DD regardless of driver type (Date or string)
        let lastActiveDateStr: string | null = null;
        if (r.last_active) {
          if (r.last_active instanceof Date) {
            lastActiveDateStr = (r.last_active as Date).toISOString().slice(0, 10);
          } else {
            // could be string like '2025-11-11' or '2025-11-11T00:00:00.000Z'
            const s = String(r.last_active);
            const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
            lastActiveDateStr = m ? m[1] : s;
          }
        } else {
          lastActiveDateStr = null;
        }

        const toUtc4DateString = (d = new Date()) => {
          const ms = d.getTime() - 4 * 60 * 60 * 1000;
          return new Date(ms).toISOString().slice(0, 10);
        };
        const todayStr = toUtc4DateString();
        const yesterdayStr = toUtc4DateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

        let newStreak = 1;
        if (lastActiveDateStr) {
          if (lastActiveDateStr === todayStr) {
            newStreak = prevStreak;
          } else if (lastActiveDateStr === yesterdayStr) {
            newStreak = prevStreak + 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        // Debug logging to help diagnose why streak may not change.
        try {
          console.log('[streak-debug] userId=', user.id, 'prevStreak=', prevStreak, 'lastActiveDate=', lastActiveDateStr);
          console.log('[streak-debug] today=', todayStr, 'yesterday=', yesterdayStr);
          console.log('[streak-debug] computed newStreak=', newStreak);
        } catch (e) {
          // ignore logging errors
        }

        const [updateRes] = await conn.execute('UPDATE `profile_data` SET streak = ?, last_active = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR) WHERE id = ?', [newStreak, user.id]);
        try {
          console.log('[streak-debug] updateRes=', updateRes && (updateRes as any).affectedRows ? (updateRes as any).affectedRows : updateRes);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('No se pudo actualizar streak/last_active en login (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
    }

    await conn.end();

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
