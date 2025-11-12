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
    const { userId, score, durationSeconds, category } = await req.json();
    if (!userId || typeof score !== 'number' || typeof durationSeconds !== 'number') {
      return NextResponse.json({ error: 'Faltan campos o tipos inválidos' }, { status: 400 });
    }

    const conn = await getConnection();
    try {
      // Insertar intento en user_quizzes
      await conn.execute(
        'INSERT INTO `user_quizzes` (`user_id`, `category`, `score`, `duration_seconds`) VALUES (?,?,?,?)',
        [userId, category || null, score, durationSeconds]
      );

      // Intentar actualizar agregados en profile_data (quizzes_completed, average_score)
      try {
        // Leer valores actuales (sin study_time)
        const [rows] = await conn.execute('SELECT quizzes_completed, average_score FROM `profile_data` WHERE id = ? LIMIT 1', [userId]);
        const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
        if (row) {
          const prevCount = Number(row.quizzes_completed || 0);
          const prevAvg = Number(row.average_score || 0);

          const newCount = prevCount + 1;
          const newAvg = newCount === 0 ? score : (prevAvg * prevCount + score) / newCount;

          await conn.execute('UPDATE `profile_data` SET quizzes_completed = ?, average_score = ? WHERE id = ?', [newCount, newAvg, userId]);
        }
      } catch (e) {
        // Si falla al actualizar (columnas no existen), ignoramos para evitar romper la petición
        console.warn('No se pudo actualizar agregados en profile_data (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
      }

      // Intentar actualizar racha (streak) y last_active.
      // Lógica: usamos fechas en UTC para una regla de "día calendario UTC" por simplicidad.
      // - Si last_active es hoy (UTC) -> no cambiar la racha
      // - Si last_active es ayer (UTC) -> incrementar racha
      // - Si last_active es más antiguo o nulo -> resetear a 1
      try {
        // Intentamos leer streak y last_active; si no existen las columnas, lanzará y lo capturamos
        const [rows2] = await conn.execute('SELECT streak, last_active FROM `profile_data` WHERE id = ? LIMIT 1', [userId]);
        const r = Array.isArray(rows2) && rows2.length ? (rows2 as any)[0] : null;
        if (r) {
            const prevStreak = Number(r.streak || 0);
            // Normalize last_active to YYYY-MM-DD regardless of driver type
            let lastActiveDateStr: string | null = null;
            if (r.last_active) {
              if (r.last_active instanceof Date) {
                lastActiveDateStr = (r.last_active as Date).toISOString().slice(0, 10);
              } else {
                const s = String(r.last_active);
                const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
                lastActiveDateStr = m ? m[1] : s;
              }
            } else {
              lastActiveDateStr = null;
            }

            // Calculamos la fecha "hoy" y "ayer" en UTC-4 como strings YYYY-MM-DD
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

            // Actualizamos streak y last_active a la fecha (DATE) correspondiente en UTC-4
            await conn.execute('UPDATE `profile_data` SET streak = ?, last_active = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR) WHERE id = ?', [newStreak, userId]);
        }
      } catch (e) {
        // Si las columnas no existen (migración no aplicada), ignoramos para no romper la petición
        console.warn('No se pudo actualizar streak/last_active (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
      }

      await conn.end();
      return NextResponse.json({ ok: true });
    } catch (e) {
      await conn.end();
      console.error('Error procesando quiz:', e);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
